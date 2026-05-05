import { NextResponse } from "next/server";

// Deprecated: kept for back-compat. Use /api/checkout/create-order.
export async function POST() {
  return NextResponse.json(
    { error: "Use /api/checkout/create-order instead" },
    { status: 410 },
  );
}
