import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/pricing";
import {
  Sparkles,
  ShoppingBag,
  Trash2,
  Tag,
  ShieldCheck,
  Truck,
  Lock,
  Check,
  ArrowRight,
  ArrowLeft,
  Star,
  Camera,
  MessageCircle,
  Stethoscope,
} from "lucide-react";
import BackButton from "@/components/BackButton";

const INCLUDED = [
  { icon: Camera, label: "Unlimited AI scans" },
  { icon: MessageCircle, label: "Unlimited Derma chat" },
  { icon: Sparkles, label: "Personalized routines" },
  { icon: Stethoscope, label: "Expert dermatologist reviews" },
];

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { plan: planId } = await searchParams;
  if (!planId || !(planId in PLANS)) redirect("/subscription");
  if (isPremium(user.subscription)) redirect("/subscription");

  const plan = PLANS[planId as PlanId];
  const monthlyEquivalent = Math.round(plan.amountInr / (plan.durationDays / 30));
  const gst = Math.round((plan.amountInr * 18) / 118);
  const exGst = plan.amountInr - gst;

  // Suggest yearly upgrade if not already on yearly
  const upsell = plan.id !== "premium_yearly" ? PLANS.premium_yearly : null;
  const upsellMonthly = upsell ? Math.round(upsell.amountInr / 12) : 0;
  const monthlySavings = upsell ? monthlyEquivalent - upsellMonthly : 0;

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-5">
      <BackButton href="/subscription" label="Back to plans" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Your cart</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <ShoppingBag size={14} /> 1 item · review and proceed to payment
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-5">
        {/* Cart items */}
        <div className="space-y-4">
          {/* Item card */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-emerald-700 text-white p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10" />
              <div className="absolute right-12 -bottom-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur grid place-items-center flex-shrink-0">
                  <Sparkles size={28} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-white/80">
                    Subscription
                  </div>
                  <h2 className="text-xl font-extrabold mt-0.5">DermAI Premium</h2>
                  <div className="text-xs text-white/80 mt-0.5">{plan.label} plan</div>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800">{plan.label} Premium</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {plan.durationDays} days · auto-renews · cancel anytime
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-slate-900">₹{plan.amountInr}</div>
                  <div className="text-[11px] text-slate-400">
                    ≈ ₹{monthlyEquivalent}/mo
                  </div>
                </div>
              </div>

              {/* What's included */}
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Included in your plan
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {INCLUDED.map((f) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.label} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check size={14} className="text-brand-700 flex-shrink-0" /> {f.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Link
                  href="/subscription"
                  className="text-sm text-slate-500 hover:text-coral-600 inline-flex items-center gap-1.5 font-medium"
                >
                  <Trash2 size={14} /> Remove
                </Link>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Tag size={11} /> Have a coupon? Add at checkout
                </div>
              </div>
            </div>
          </div>

          {/* Upsell */}
          {upsell && monthlySavings > 0 && (
            <Link
              href={`/subscription/cart?plan=${upsell.id}`}
              className="block rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-200 p-5 hover:shadow-md transition relative overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/40" />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white grid place-items-center text-amber-600 flex-shrink-0 shadow-sm">
                  <Star size={20} fill="currentColor" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
                    Save more
                  </div>
                  <div className="font-bold text-slate-800">
                    Switch to Yearly · ₹{upsellMonthly}/mo
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Save ₹{monthlySavings * 12} a year compared to {plan.label.toLowerCase()} billing
                  </div>
                </div>
                <ArrowRight size={18} className="text-amber-700" />
              </div>
            </Link>
          )}

          {/* Trust row */}
          <div className="grid grid-cols-3 gap-3">
            <Trust icon={ShieldCheck} title="Secure" sub="256-bit SSL" />
            <Trust icon={Lock} title="Private" sub="Your data stays yours" />
            <Trust icon={Truck} title="Instant" sub="Activated in seconds" />
          </div>
        </div>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 self-start space-y-3">
          <div className="card p-5">
            <div className="font-extrabold text-slate-900 text-lg mb-4">Order summary</div>
            <div className="space-y-2.5 text-sm">
              <Row label="Subtotal (excl. GST)" value={`₹${exGst}`} />
              <Row label="GST (18%)" value={`₹${gst}`} />
              <Row label="Item total" value={`₹${plan.amountInr}`} bold />
            </div>
            <div className="border-t border-slate-100 my-4" />
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold">Total</span>
              <span className="text-3xl font-extrabold text-slate-900">₹{plan.amountInr}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Renews automatically. Cancel anytime in settings.
            </div>
          </div>

          <Link
            href={`/subscription/checkout?plan=${plan.id}`}
            className="w-full block bg-brand hover:bg-brand-700 text-white text-center py-4 rounded-2xl font-bold text-base transition shadow-lg"
          >
            <span className="inline-flex items-center gap-2">
              Proceed to checkout <ArrowRight size={16} />
            </span>
          </Link>

          <Link
            href="/subscription"
            className="w-full block text-center py-3 rounded-2xl font-medium text-sm text-slate-600 hover:bg-white"
          >
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft size={14} /> Continue browsing
            </span>
          </Link>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-[11px] text-slate-500 text-center">
            Pay via UPI, debit/credit card, or net banking on the next step.
          </div>
        </aside>
      </div>
    </div>
  );
}

function Trust({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center mb-2">
        <Icon size={16} />
      </div>
      <div className="font-bold text-sm text-slate-800">{title}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "text-slate-800 font-semibold" : "text-slate-500"}>{label}</span>
      <span className={bold ? "text-slate-900 font-bold" : "text-slate-700"}>{value}</span>
    </div>
  );
}
