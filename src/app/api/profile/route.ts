import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const Body = z.object({
  age: z.number().int().min(1).max(120).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  skinType: z.enum(["oily", "dry", "combination", "normal", "sensitive"]).optional(),
  concerns: z.array(z.string()).optional(),
  fullName: z.string().min(1).optional(),
});

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data = parsed.data;
  if (data.fullName) {
    await prisma.user.update({ where: { id: user.id }, data: { fullName: data.fullName } });
  }
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      age: data.age,
      gender: data.gender,
      skinType: data.skinType,
      concerns: data.concerns ? JSON.stringify(data.concerns) : null,
    },
    update: {
      age: data.age,
      gender: data.gender,
      skinType: data.skinType,
      concerns: data.concerns ? JSON.stringify(data.concerns) : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
