import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { email, password, fullName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      fullName,
      profile: { create: {} },
      healthScore: { create: {} },
    },
  });

  await createSession({ userId: user.id, email: user.email, role: user.role });
  return NextResponse.json({ id: user.id, email: user.email });
}
