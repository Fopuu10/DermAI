// All prices in INR (rupees). Razorpay needs paise (×100) at order creation.
export type PlanId = "premium_monthly" | "premium_quarterly" | "premium_yearly";

export type Plan = {
  id: PlanId;
  label: string;
  amountInr: number; // ₹
  durationDays: number;
  savingsLabel?: string;
};

export const PLANS: Record<PlanId, Plan> = {
  premium_monthly: {
    id: "premium_monthly",
    label: "Monthly",
    amountInr: 299,
    durationDays: 30,
  },
  premium_quarterly: {
    id: "premium_quarterly",
    label: "Quarterly",
    amountInr: 799,
    durationDays: 90,
    savingsLabel: "Save 11%",
  },
  premium_yearly: {
    id: "premium_yearly",
    label: "Yearly",
    amountInr: 1499,
    durationDays: 365,
    savingsLabel: "Save 58%",
  },
};

export const GST_RATE = 0.18;

export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100);
}

export function formatINR(amountInr: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInr);
}
