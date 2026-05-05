import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [users, scans, posts, activeSubs] = await Promise.all([
    prisma.user.count(),
    prisma.diagnosisRecord.count(),
    prisma.communityPost.count(),
    prisma.subscription.count({ where: { status: "active" } }),
  ]);

  const conditionCounts = await prisma.diagnosisRecord.groupBy({
    by: ["predictedCondition"],
    _count: { _all: true },
    orderBy: { _count: { predictedCondition: "desc" } },
    take: 10,
  });

  return NextResponse.json({ users, scans, posts, activeSubs, conditionCounts });
}
