import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: { status: "canceled", autoRenew: false },
  });
  return NextResponse.json({ ok: true });
}
