import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const conditions = await prisma.condition.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ conditions });
}
