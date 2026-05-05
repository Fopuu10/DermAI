import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, rupeesToPaise, type PlanId } from "@/lib/pricing";

const Body = z.object({ planId: z.enum(["premium_monthly", "premium_quarterly", "premium_yearly"]) });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const plan = PLANS[parsed.data.planId as PlanId];
  const amountPaise = rupeesToPaise(plan.amountInr);

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // No keys configured → mock mode (instantly activate, useful for dev)
  if (!keyId || !keySecret) {
    const endDate = new Date(Date.now() + plan.durationDays * 24 * 3600 * 1000);
    await prisma.paymentTransaction.create({
      data: {
        userId: user.id,
        provider: "mock",
        providerOrderId: `mock_${Date.now()}`,
        providerPaymentId: `mock_pay_${Date.now()}`,
        planId: plan.id,
        amount: amountPaise,
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
    return NextResponse.json({ mock: true, ok: true, endDate });
  }

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await rzp.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `sub_${user.id.slice(0, 20)}_${Date.now()}`,
    notes: { userId: user.id, planId: plan.id },
  });

  await prisma.paymentTransaction.create({
    data: {
      userId: user.id,
      provider: "razorpay",
      providerOrderId: order.id,
      planId: plan.id,
      amount: amountPaise,
      currency: "INR",
      status: "pending",
    },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId,
    planLabel: plan.label,
    customerEmail: user.email,
    customerName: user.fullName,
  });
}
