import { getCurrentUser, isPremium } from "@/lib/auth";
import {
  Sparkles,
  Check,
  X,
  Camera,
  History,
  MessageCircle,
  Sun,
  Users,
  Award,
  Stethoscope,
  Star,
  Quote,
} from "lucide-react";
import { PLANS } from "@/lib/pricing";
import SubscribeButton from "./SubscribeButton";
import CancelButton from "./CancelButton";

const FEATURES = [
  { icon: Camera, label: "AI Skin Scans", free: "3 / month", premium: "Unlimited" },
  { icon: History, label: "Scan history", free: "Last 3 only", premium: "Full history" },
  { icon: MessageCircle, label: "Derma chat", free: "10 / day", premium: "Unlimited" },
  { icon: Sun, label: "Personalized routines", free: false, premium: true },
  { icon: Users, label: "Image posts in community", free: false, premium: true },
  { icon: Stethoscope, label: "Expert dermatologist review", free: false, premium: true },
  { icon: Award, label: "Progress charts & trends", free: false, premium: true },
];

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "Premium member · 6 months",
    body: "The personalized routines actually work — my skin texture is dramatically better. Worth every rupee.",
    initial: "P",
    tint: "bg-rose-100 text-rose-600",
  },
  {
    name: "Arjun K.",
    role: "Premium member · 3 months",
    body: "The Derma chat caught a stubborn fungal infection my OTC treatments missed. Saved me a doctor visit.",
    initial: "A",
    tint: "bg-emerald-100 text-emerald-600",
  },
  {
    name: "Meera R.",
    role: "Premium member · 1 year",
    body: "Tracking my eczema flares with the progress charts has been life-changing. I finally know my triggers.",
    initial: "M",
    tint: "bg-purple-100 text-purple-600",
  },
];

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes — cancel from this page in one click. You'll keep access until the end of your billing period.",
  },
  {
    q: "What payment methods are accepted?",
    a: "UPI, debit/credit cards, and net banking via Razorpay. All major Indian banks supported.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. Your scans and chat history are stored encrypted. We never share data with third parties or use it to train models.",
  },
  {
    q: "What's the refund policy?",
    a: "Not satisfied within 7 days? Email us and we'll refund in full, no questions asked.",
  },
];

export default async function SubscriptionPage() {
  const user = (await getCurrentUser())!;
  const premium = isPremium(user.subscription);
  const razorpayConfigured = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <div className="relative rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-700 text-white p-8 md:p-12 overflow-hidden text-center">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-white/10" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium mb-4">
            <Sparkles size={14} /> DermAI Premium
          </span>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            {premium ? (
              <>You're a Premium member ✨</>
            ) : (
              <>
                Unlock the full<br />power of DermAI
              </>
            )}
          </h1>
          <p className="text-white/80 mt-3 max-w-xl mx-auto">
            {premium
              ? `Active until ${user.subscription && new Date(user.subscription.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
              : "Unlimited scans, full history, expert chat & more — pay in INR via UPI, cards, or net banking."}
          </p>
        </div>
      </div>

      {!premium ? (
        <>
          {/* Pricing tiers */}
          <div className="grid md:grid-cols-3 gap-4">
            <PlanCard plan={PLANS.premium_monthly} />
            <PlanCard plan={PLANS.premium_quarterly} />
            <PlanCard plan={PLANS.premium_yearly} highlight />
          </div>

          {/* Feature comparison */}
          <div className="card p-6 md:p-8">
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-1">
              Free vs Premium
            </h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Everything you get when you upgrade
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <div className="grid grid-cols-3 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Feature</div>
                <div className="text-center">Free</div>
                <div className="text-center text-brand-700">Premium</div>
              </div>
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    className={`grid grid-cols-3 px-5 py-4 items-center ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 grid place-items-center">
                        <Icon size={14} />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{f.label}</span>
                    </div>
                    <div className="text-center">
                      {typeof f.free === "boolean" ? (
                        f.free ? (
                          <Check size={18} className="text-brand-700 mx-auto" />
                        ) : (
                          <X size={18} className="text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs text-slate-500">{f.free}</span>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof f.premium === "boolean" ? (
                        f.premium ? (
                          <Check size={18} className="text-brand-700 mx-auto" />
                        ) : (
                          <X size={18} className="text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs font-semibold text-brand-700">{f.premium}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testimonials */}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-1">
              Loved by skin enthusiasts
            </h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Real members, real results
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="card p-5 relative">
                  <Quote
                    size={24}
                    className="absolute -top-2 left-4 text-brand-200"
                    fill="currentColor"
                  />
                  <div className="flex gap-0.5 mb-3 pt-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} className="text-amber-400" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{t.body}</p>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                    <div className={`w-10 h-10 rounded-full grid place-items-center font-bold ${t.tint}`}>
                      {t.initial}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{t.name}</div>
                      <div className="text-[11px] text-slate-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="card p-6 md:p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Frequently asked questions</h2>
            <p className="text-sm text-slate-500 mb-6">Common questions about Premium</p>
            <div className="space-y-2">
              {FAQ.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100/70 transition"
                >
                  <summary className="cursor-pointer font-semibold text-sm text-slate-800 flex items-center justify-between">
                    {f.q}
                    <span className="text-slate-400 group-open:rotate-45 transition text-lg leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-sm text-slate-600 leading-relaxed mt-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card p-8">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-700 capitalize">
                {user.subscription?.planId.replace("premium_", "")}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">Plan</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800">₹{user.subscription?.amount}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">Last billed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800">
                {user.subscription &&
                  Math.max(
                    0,
                    Math.ceil(
                      (new Date(user.subscription.endDate).getTime() - Date.now()) /
                        (24 * 3600 * 1000),
                    ),
                  )}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">Days left</div>
            </div>
          </div>
          <div className="text-center pt-4 border-t border-slate-100">
            <CancelButton />
          </div>
        </div>
      )}

      {/* Trust footer */}
      <div className="card p-5 text-xs text-slate-500 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 font-semibold text-slate-700">
          <Stethoscope size={14} /> Secure payments by Razorpay
        </div>
        <div>UPI · Cards · Net Banking — all major Indian banks</div>
        <div>All prices include GST. Cancel anytime.</div>
        {!razorpayConfigured && (
          <div className="text-coral-600 font-medium pt-1">
            Razorpay keys not configured — currently using mock checkout (instant activation).
          </div>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  highlight = false,
}: {
  plan: (typeof PLANS)[keyof typeof PLANS];
  highlight?: boolean;
}) {
  const monthly = plan.amountInr / (plan.durationDays / 30);
  return (
    <div
      className={`card p-6 relative overflow-hidden ${
        highlight ? "ring-2 ring-coral border-coral-100 shadow-lg" : ""
      }`}
    >
      {highlight && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-coral to-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
          Best value
        </div>
      )}
      {plan.savingsLabel && (
        <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-3">
          {plan.savingsLabel}
        </span>
      )}
      <div className="text-sm text-slate-500 font-medium">{plan.label}</div>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-4xl font-bold text-slate-800">₹{plan.amountInr}</span>
      </div>
      <div className="text-xs text-slate-400 mt-1">
        {plan.id === "premium_monthly"
          ? "billed monthly"
          : plan.id === "premium_quarterly"
            ? `≈ ₹${Math.round(monthly)}/mo · billed quarterly`
            : `≈ ₹${Math.round(monthly)}/mo · billed yearly`}
      </div>
      <div className="mt-5">
        <SubscribeButton planId={plan.id} />
      </div>
    </div>
  );
}
