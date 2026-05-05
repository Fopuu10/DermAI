import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ articles });
}
