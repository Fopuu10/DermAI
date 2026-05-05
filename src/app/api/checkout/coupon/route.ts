import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findCoupon, applyCoupon } from "@/lib/coupons";
import { PLANS, type PlanId } from "@/lib/pricing";

const Body = z.object({
  code: z.string().min(1).max(40),
  planId: z.enum(["premium_monthly", "premium_quarterly", "premium_yearly"]),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const coupon = findCoupon(parsed.data.code);
  if (!coupon) return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });

  const plan = PLANS[parsed.data.planId as PlanId];
  // GST included pricing — show breakdown
  const baseAmount = plan.amountInr;
  const result = applyCoupon(baseAmount, coupon);

  return NextResponse.json({
    code: coupon.code,
    description: coupon.description,
    percentOff: coupon.percentOff,
    discount: result.discount,
    total: result.total,
    isFree: result.isFree,
  });
}
