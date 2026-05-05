import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recomputeHealthScore } from "@/lib/health-score";

const Body = z.object({
  selfRating: z.number().int().min(1).max(5),
  notes: z.string().optional(),
  followUpScanId: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const followUp = await prisma.followUp.findFirst({
    where: { id, userId: user.id },
    include: { originalDiagnosis: true },
  });
  if (!followUp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.followUp.update({
    where: { id },
    data: {
      status: "completed",
      completedDate: new Date(),
      selfRating: parsed.data.selfRating,
      notes: parsed.data.notes,
      followUpScanId: parsed.data.followUpScanId,
    },
  });

  // Update journey trend
  const trend =
    parsed.data.selfRating >= 4 ? "improving" : parsed.data.selfRating <= 2 ? "worsening" : "stable";
  await prisma.conditionJourney.updateMany({
    where: { userId: user.id, conditionName: followUp.originalDiagnosis.predictedCondition },
    data: { trend },
  });

  await recomputeHealthScore(user.id);
  return NextResponse.json({ ok: true });
}
