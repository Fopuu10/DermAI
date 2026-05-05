import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/pricing";

// Razorpay webhook: configure URL in Razorpay dashboard with the same secret
// as RAZORPAY_WEBHOOK_SECRET. Razorpay POSTs JSON; we verify signature against
// the raw body before trusting the payload.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (expected !== sig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const body = JSON.parse(raw);
  const event = body.event as string;
  const payment = body.payload?.payment?.entity;
  if (!payment) return NextResponse.json({ ok: true }); // ignore non-payment events

  const orderId = payment.order_id as string;
  const paymentId = payment.id as string;
  const tx = await prisma.paymentTransaction.findFirst({ where: { providerOrderId: orderId } });
  if (!tx) return NextResponse.json({ ok: true }); // unknown order — silently ack

  if (event === "payment.captured") {
    const plan = PLANS[tx.planId as PlanId];
    if (!plan) return NextResponse.json({ ok: true });
    const endDate = new Date(Date.now() + plan.durationDays * 24 * 3600 * 1000);
    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { providerPaymentId: paymentId, status: "success" },
    });
    await prisma.subscription.upsert({
      where: { userId: tx.userId },
      create: {
        userId: tx.userId,
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
  } else if (event === "payment.failed") {
    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { providerPaymentId: paymentId, status: "failed" },
    });
  }

  return NextResponse.json({ ok: true });
}
