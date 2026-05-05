import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getChatReply } from "@/lib/chat";
import { getChatQuota, incrementChatUsage } from "@/lib/gating";

const Body = z.object({ content: z.string().min(1).max(4000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const session = await prisma.chatSession.findFirst({ where: { id, userId: user.id } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const quota = await getChatQuota(user.id);
  if (!quota.premium && quota.remaining <= 0) {
    return NextResponse.json(
      {
        error: "You've used your 10 free messages today. Upgrade to Premium for unlimited chat with Derma.",
        code: "QUOTA",
      },
      { status: 402 },
    );
  }

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const userMsg = await prisma.chatMessage.create({
    data: { sessionId: id, role: "user", content: parsed.data.content },
  });

  const reply = await getChatReply(
    user.id,
    history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
    parsed.data.content,
  );

  const assistantMsg = await prisma.chatMessage.create({
    data: {
      sessionId: id,
      role: "assistant",
      content: reply.content,
      safetyFlag: reply.safety_flag,
    },
  });

  // Set title from first user message if still default
  if (session.title === "New chat") {
    await prisma.chatSession.update({
      where: { id },
      data: {
        title: parsed.data.content.slice(0, 50) + (parsed.data.content.length > 50 ? "…" : ""),
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.chatSession.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  await incrementChatUsage(user.id);

  return NextResponse.json({ userMessage: userMsg, assistantMessage: assistantMsg });
}
