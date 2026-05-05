import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { generateRoutine } from "@/lib/diagnosis";

const Body = z.object({ condition: z.string().min(1) });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPremium(user.subscription))
    return NextResponse.json({ error: "Premium feature", code: "PREMIUM_REQUIRED" }, { status: 402 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const routine = generateRoutine(user.profile?.skinType, parsed.data.condition);

  await prisma.routine.deleteMany({ where: { userId: user.id } });
  const morning = await prisma.routine.create({
    data: { userId: user.id, type: "morning", steps: JSON.stringify(routine.morning) },
  });
  const night = await prisma.routine.create({
    data: { userId: user.id, type: "night", steps: JSON.stringify(routine.night) },
  });
  return NextResponse.json({ morning, night });
}
