import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const Body = z.object({
  body: z.string().min(1).max(4000),
  isAnonymous: z.boolean().default(false),
  parentCommentId: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const post = await prisma.communityPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const comment = await prisma.communityComment.create({
    data: {
      postId: id,
      userId: user.id,
      body: parsed.data.body,
      isAnonymous: parsed.data.isAnonymous,
      parentCommentId: parsed.data.parentCommentId,
    },
  });
  return NextResponse.json({ comment });
}
