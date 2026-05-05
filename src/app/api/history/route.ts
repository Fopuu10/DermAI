import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isPremium } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const premium = isPremium(user.subscription);
  const records = await prisma.diagnosisRecord.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: premium ? 200 : 3,
  });
  return NextResponse.json({ records, premium });
}
