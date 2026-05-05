import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, type PlanId, rupeesToPaise } from "@/lib/pricing";
import { findCoupon, applyCoupon } from "@/lib/coupons";

const Body = z.object({
  planId: z.enum(["premium_monthly", "premium_quarterly", "premium_yearly"]),
  couponCode: z.string().optional(),
  // The card details aren't actually processed — we just record the last 4 for receipt UX.
  card: z
    .object({
      last4: z.string().length(4),
      brand: z.string().optional(),
    })
    .optional(),
  paymentMethod: z.enum(["card", "upi", "netbanking", "free"]).default("card"),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const plan = PLANS[parsed.data.planId as PlanId];
  const coupon = parsed.data.couponCode ? findCoupon(parsed.data.couponCode) : null;
  const { discount, total, isFree } = applyCoupon(plan.amountInr, coupon);

  // If not free, we'd normally hand off to a real gateway here.
  // For the demo we accept the (fake) card details and proceed.
  if (!isFree && parsed.data.paymentMethod === "card" && !parsed.data.card) {
    return NextResponse.json({ error: "Card details required" }, { status: 400 });
  }

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const endDate = new Date(Date.now() + plan.durationDays * 24 * 3600 * 1000);

  const tx = await prisma.paymentTransaction.create({
    data: {
      userId: user.id,
      provider: isFree ? "coupon" : "demo",
      providerOrderId: orderId,
      providerPaymentId: `${orderId}-PAY`,
      planId: plan.id,
      amount: rupeesToPaise(total),
      currency: "INR",
      status: "success",
    },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      planId: plan.id,
      status: "active",
      endDate,
      currency: "INR",
      amount: total,
    },
    update: {
      planId: plan.id,
      status: "active",
      startDate: new Date(),
      endDate,
      autoRenew: true,
      currency: "INR",
      amount: total,
    },
  });

  return NextResponse.json({
    ok: true,
    orderId,
    transactionId: tx.id,
    plan: plan.id,
    planLabel: plan.label,
    baseAmount: plan.amountInr,
    discount,
    total,
    couponCode: coupon?.code ?? null,
    paymentMethod: parsed.data.paymentMethod,
    cardLast4: parsed.data.card?.last4 ?? null,
    cardBrand: parsed.data.card?.brand ?? null,
    endDate: endDate.toISOString(),
  });
}
