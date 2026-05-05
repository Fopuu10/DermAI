import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recomputeHealthScore } from "@/lib/health-score";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [scans, completedFollowUps, journeys, healthScore, badges] = await Promise.all([
    prisma.diagnosisRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, predictedCondition: true, confidence: true, safetyFlag: true },
    }),
    prisma.followUp.findMany({
      where: { userId: user.id, status: "completed" },
      orderBy: { completedDate: "asc" },
    }),
    prisma.conditionJourney.findMany({ where: { userId: user.id } }),
    recomputeHealthScore(user.id),
    prisma.userAchievement.findMany({ where: { userId: user.id }, include: { badge: true } }),
  ]);

  // Count scans by week
  const weekly: Record<string, number> = {};
  for (const s of scans) {
    const d = new Date(s.createdAt);
    const monday = new Date(d);
    monday.setDate(d.getDate() - d.getDay());
    const key = monday.toISOString().slice(0, 10);
    weekly[key] = (weekly[key] || 0) + 1;
  }

  // Pie of conditions
  const byCondition: Record<string, number> = {};
  for (const s of scans) byCondition[s.predictedCondition] = (byCondition[s.predictedCondition] || 0) + 1;

  return NextResponse.json({
    healthScore,
    weekly,
    byCondition,
    safetyAlerts: scans.filter((s) => s.safetyFlag).length,
    totalScans: scans.length,
    completedFollowUps: completedFollowUps.length,
    journeys,
    badges,
  });
}
