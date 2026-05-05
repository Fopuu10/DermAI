import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isPremium } from "@/lib/auth";

const Body = z.object({
  title: z.string().min(3).max(140),
  body: z.string().min(1).max(8000),
  tags: z.array(z.string()).default([]),
  isAnonymous: z.boolean().default(false),
  images: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag");
  const where = tag ? { status: "active", tags: { contains: tag } } : { status: "active" };
  const posts = await prisma.communityPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { fullName: true } }, _count: { select: { comments: true } } },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Image posts gated to premium
  if (parsed.data.images && parsed.data.images.length > 0 && !isPremium(user.subscription)) {
    return NextResponse.json(
      { error: "Image posts are a Premium feature.", code: "PREMIUM_REQUIRED" },
      { status: 402 },
    );
  }

  const post = await prisma.communityPost.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      tags: JSON.stringify(parsed.data.tags),
      isAnonymous: parsed.data.isAnonymous,
      images: parsed.data.images ? JSON.stringify(parsed.data.images) : null,
    },
  });
  return NextResponse.json({ post });
}
