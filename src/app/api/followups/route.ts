import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const followUps = await prisma.followUp.findMany({
    where: { userId: user.id },
    include: { originalDiagnosis: true },
    orderBy: { scheduledDate: "asc" },
  });
  return NextResponse.json({ followUps });
}
