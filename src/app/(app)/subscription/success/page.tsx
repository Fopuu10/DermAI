"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Sparkles, Download, ArrowRight, Camera, MessageCircle, Award } from "lucide-react";

type Order = {
  orderId: string;
  transactionId: string;
  plan: string;
  planLabel: string;
  baseAmount: number;
  discount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  cardLast4: string | null;
  cardBrand: string | null;
  endDate: string;
};

export default function SuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("derma_last_order");
    if (!stored) {
      router.replace("/subscription");
      return;
    }
    setOrder(JSON.parse(stored));
  }, [router]);

  if (!order) return null;

  const endDate = new Date(order.endDate);

  return (
    <div className="px-4 md:px-8 py-10 max-w-3xl mx-auto">
      {/* Big success card */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500 to-brand-700 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-white/10" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-full bg-white grid place-items-center mb-4 shadow-lg animate-in zoom-in-50">
              <CheckCircle2 size={48} className="text-emerald-600" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Welcome to Premium!</h1>
            <p className="text-white/80 mt-2">
              Your subscription is active. Let's keep your skin journey going.
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-5">
          {/* Order details */}
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Order ID" value={order.orderId} mono />
            <Detail
              label="Plan"
              value={`DermAI Premium · ${order.planLabel}`}
            />
            <Detail
              label="Amount paid"
              value={order.total === 0 ? "₹0 (Coupon)" : `₹${order.total}`}
            />
            <Detail
              label="Active until"
              value={endDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            />
            {order.couponCode && (
              <Detail
                label="Coupon"
                value={`${order.couponCode} (−₹${order.discount})`}
              />
            )}
            {order.cardLast4 && (
              <Detail
                label="Payment method"
                value={`${order.cardBrand ?? "Card"} •••• ${order.cardLast4}`}
              />
            )}
            {order.paymentMethod === "free" && !order.cardLast4 && (
              <Detail label="Payment method" value="Free with coupon" />
            )}
          </div>

          {/* Next-step actions */}
          <div className="grid md:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
            <NextAction href="/scan" icon={Camera} title="Run a scan" sub="Now unlimited" tint="bg-brand-50 text-brand-700" />
            <NextAction
              href="/chat"
              icon={MessageCircle}
              title="Chat with Derma"
              sub="Unlimited messages"
              tint="bg-purple-50 text-purple-600"
            />
            <NextAction
              href="/routines"
              icon={Sparkles}
              title="Generate routine"
              sub="AI-personalized"
              tint="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Receipt + dashboard CTA */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            <button className="btn-ghost">
              <Download size={14} /> Download receipt
            </button>
            <Link href="/profile" className="btn-ghost">
              View subscription
            </Link>
            <Link href="/dashboard" className="btn-primary ml-auto">
              Go to dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Achievement banner */}
      <div className="card p-5 mt-4 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 grid place-items-center shadow">
          <Award size={20} />
        </div>
        <div className="flex-1">
          <div className="font-bold text-slate-800">You unlocked Premium 🎉</div>
          <div className="text-xs text-slate-600">
            All Premium features are now active. Visit profile to manage billing anytime.
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className={`text-sm font-bold text-slate-800 mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function NextAction({
  href,
  icon: Icon,
  title,
  sub,
  tint,
}: {
  href: string;
  icon: any;
  title: string;
  sub: string;
  tint: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-100 p-4 hover:bg-slate-50 hover:shadow-sm transition"
    >
      <div className={`w-10 h-10 rounded-lg grid place-items-center ${tint} mb-2`}>
        <Icon size={16} />
      </div>
      <div className="font-semibold text-sm text-slate-800">{title}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </Link>
  );
}
