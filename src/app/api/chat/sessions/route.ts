import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.id, status: "active" },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return NextResponse.json({ sessions });
}

export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await prisma.chatSession.create({
    data: { userId: user.id, title: "New chat" },
  });
  return NextResponse.json({ session });
}
