"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PlanId } from "@/lib/pricing";

export default function SubscribeButton({ planId }: { planId: PlanId }) {
  return (
    <Link
      href={`/subscription/cart?plan=${planId}`}
      className="btn-coral w-full justify-center py-2.5 font-semibold"
    >
      Add to cart <ArrowRight size={14} />
    </Link>
  );
}
