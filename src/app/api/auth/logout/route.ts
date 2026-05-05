import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await clearSession();
  // If called via fetch, return JSON. If called from a form/browser navigation
  // (Accept: text/html), redirect to login so the user doesn't see raw JSON.
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  await clearSession();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
