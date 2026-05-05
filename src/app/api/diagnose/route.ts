import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { diagnose } from "@/lib/diagnosis";
import { getScanQuota, incrementScanUsage } from "@/lib/gating";
import { recomputeHealthScore } from "@/lib/health-score";

const Body = z.object({
  imageUrl: z.string().optional(),
  imageBase64: z.string().optional(), // legacy fallback
  age: z.number().int().min(1).max(120),
  gender: z.string(),
  bodyPart: z.string().min(1),
  duration: z.number().int().min(0).max(3650),
  symptoms: z.array(z.string()).default([]),
  extraNotes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const quota = await getScanQuota(user.id);
  if (!quota.premium && quota.remaining <= 0) {
    return NextResponse.json(
      { error: "Free scan limit reached for this month. Upgrade to Premium for unlimited scans.", code: "QUOTA" },
      { status: 402 },
    );
  }

  const conditions = await prisma.condition.findMany();
  const result = diagnose(
    {
      age: parsed.data.age,
      gender: parsed.data.gender,
      bodyPart: parsed.data.bodyPart,
      durationDays: parsed.data.duration,
      symptoms: parsed.data.symptoms,
      extraNotes: parsed.data.extraNotes,
    },
    conditions,
  );

  const record = await prisma.diagnosisRecord.create({
    data: {
      userId: user.id,
      imageUrl: parsed.data.imageUrl ?? parsed.data.imageBase64?.slice(0, 200_000) ?? null,
      bodyPart: parsed.data.bodyPart,
      durationDays: parsed.data.duration,
      symptoms: JSON.stringify(parsed.data.symptoms),
      extraNotes: parsed.data.extraNotes,
      predictedCondition: result.predicted_condition,
      confidence: result.confidence,
      description: result.description,
      possibleEffects: JSON.stringify(result.possible_effects),
      prevention: JSON.stringify(result.prevention),
      solutions: JSON.stringify(result.solutions),
      disclaimer: result.disclaimer,
      safetyFlag: result.safety_flag,
    },
  });

  await incrementScanUsage(user.id);

  // Auto-create three follow-ups (Day 7, 14, 30)
  const now = new Date();
  await prisma.followUp.createMany({
    data: [7, 14, 30].map((days) => ({
      userId: user.id,
      originalDiagnosisId: record.id,
      scheduledDate: new Date(now.getTime() + days * 24 * 3600 * 1000),
    })),
  });

  // Update or create condition journey
  const journey = await prisma.conditionJourney.findUnique({
    where: { userId_conditionName: { userId: user.id, conditionName: result.predicted_condition } },
  });
  const scanIds = journey ? [...JSON.parse(journey.scanIds), record.id] : [record.id];
  await prisma.conditionJourney.upsert({
    where: { userId_conditionName: { userId: user.id, conditionName: result.predicted_condition } },
    create: {
      userId: user.id,
      conditionName: result.predicted_condition,
      firstDetected: now,
      lastScanned: now,
      scanIds: JSON.stringify(scanIds),
      followUpIds: "[]",
    },
    update: { lastScanned: now, scanIds: JSON.stringify(scanIds) },
  });

  await recomputeHealthScore(user.id);

  return NextResponse.json({ recordId: record.id, ...result });
}
