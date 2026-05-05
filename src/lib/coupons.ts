// Coupon system — codes are validated both client and server side.
// Special codes can make the order ₹0 ("DERMA100") to bypass payment in demo.

export type Coupon = {
  code: string;
  description: string;
  percentOff: number; // 0-100
  expiresAt?: string;
};

export const COUPONS: Coupon[] = [
  { code: "DERMA100", description: "Free trial — 100% off (demo)", percentOff: 100 },
  { code: "WELCOME50", description: "First-time member — 50% off", percentOff: 50 },
  { code: "STUDENT25", description: "Student discount — 25% off", percentOff: 25 },
  { code: "LAUNCH10", description: "Launch offer — 10% off", percentOff: 10 },
];

export function findCoupon(code: string): Coupon | null {
  const norm = code.trim().toUpperCase();
  return COUPONS.find((c) => c.code === norm) ?? null;
}

export function applyCoupon(amountInr: number, coupon: Coupon | null) {
  if (!coupon) return { discount: 0, total: amountInr, isFree: amountInr === 0 };
  const discount = Math.round((amountInr * coupon.percentOff) / 100);
  const total = Math.max(0, amountInr - discount);
  return { discount, total, isFree: total === 0 };
}
