import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/pricing";

const Body = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  planId: z.enum(["premium_monthly", "premium_quarterly", "premium_yearly"]),
});

// Called from the client after Razorpay checkout completes — verifies signature
// and activates the subscription. Webhook is the source of truth in production
// (this provides a fast UX path; the webhook still fires).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parsed.data.razorpay_order_id}|${parsed.data.razorpay_payment_id}`)
    .digest("hex");

  if (expected !== parsed.data.razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const plan = PLANS[parsed.data.planId as PlanId];
  const endDate = new Date(Date.now() + plan.durationDays * 24 * 3600 * 1000);

  await prisma.paymentTransaction.updateMany({
    where: { providerOrderId: parsed.data.razorpay_order_id, userId: user.id },
    data: { providerPaymentId: parsed.data.razorpay_payment_id, status: "success" },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      planId: plan.id,
      status: "active",
      endDate,
      currency: "INR",
      amount: plan.amountInr,
    },
    update: {
      planId: plan.id,
      status: "active",
      startDate: new Date(),
      endDate,
      autoRenew: true,
      currency: "INR",
      amount: plan.amountInr,
    },
  });

  return NextResponse.json({ ok: true, endDate });
}
