import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.communityPost.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true } },
      comments: {
        where: { status: "active" },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { fullName: true } } },
      },
    },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.communityPost.update({ where: { id }, data: { views: { increment: 1 } } });
  return NextResponse.json({ post });
}
