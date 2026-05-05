import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isPremium } from "@/lib/auth";

const Body = z.object({
  diagnosisId: z.string(),
  question: z.string().min(5),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const consults = await prisma.dermatologistConsult.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { dermatologist: true, diagnosis: true },
  });
  return NextResponse.json({ consults });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPremium(user.subscription))
    return NextResponse.json({ error: "Premium feature", code: "PREMIUM_REQUIRED" }, { status: 402 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const derm = await prisma.dermatologist.findFirst({ where: { isAvailable: true } });
  if (!derm) return NextResponse.json({ error: "No dermatologist available" }, { status: 503 });

  const consult = await prisma.dermatologistConsult.create({
    data: {
      userId: user.id,
      diagnosisId: parsed.data.diagnosisId,
      question: parsed.data.question,
      dermatologistId: derm.id,
    },
  });
  return NextResponse.json({ consult });
}
