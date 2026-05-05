import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.postUpvote.findUnique({
    where: { postId_userId: { postId: id, userId: user.id } },
  });
  if (existing) {
    await prisma.postUpvote.delete({ where: { id: existing.id } });
    await prisma.communityPost.update({ where: { id }, data: { upvotes: { decrement: 1 } } });
    return NextResponse.json({ upvoted: false });
  }
  await prisma.postUpvote.create({ data: { postId: id, userId: user.id } });
  await prisma.communityPost.update({ where: { id }, data: { upvotes: { increment: 1 } } });
  return NextResponse.json({ upvoted: true });
}
