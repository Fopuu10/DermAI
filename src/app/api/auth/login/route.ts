import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await verifyPassword(parsed.data.password, user.hashedPassword);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await createSession({ userId: user.id, email: user.email, role: user.role });
  return NextResponse.json({ id: user.id, email: user.email });
}
