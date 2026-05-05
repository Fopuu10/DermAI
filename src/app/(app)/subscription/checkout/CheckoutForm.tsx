"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  Lock,
  Tag,
  Check,
  X,
  Sparkles,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

type Plan = {
  id: string;
  label: string;
  amountInr: number;
  savingsLabel: string | null;
  durationDays: number;
};

type CouponState = {
  code: string;
  description: string;
  percentOff: number;
  discount: number;
  total: number;
  isFree: boolean;
} | null;

type Method = "card" | "upi" | "netbanking";

const BRAND_PATTERNS: { match: RegExp; name: string }[] = [
  { match: /^4/, name: "Visa" },
  { match: /^(5[1-5]|2[2-7])/, name: "Mastercard" },
  { match: /^3[47]/, name: "Amex" },
  { match: /^6/, name: "RuPay" },
];

function detectBrand(num: string) {
  for (const b of BRAND_PATTERNS) if (b.match.test(num)) return b.name;
  return "";
}

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CheckoutForm({ plan, user }: { plan: Plan; user: { email: string; fullName: string | null } }) {
  const router = useRouter();
  const [coupon, setCoupon] = useState<CouponState>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [method, setMethod] = useState<Method>("card");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: user.fullName ?? "" });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [billingOpen, setBillingOpen] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    address1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const gst = useMemo(() => Math.round((plan.amountInr * 18) / 118), [plan.amountInr]);
  const baseExGst = plan.amountInr - gst;
  const total = coupon?.total ?? plan.amountInr;
  const isFree = coupon?.isFree ?? false;

  const cardBrand = detectBrand(card.number.replace(/\s/g, ""));
  const cardComplete =
    card.number.replace(/\s/g, "").length >= 12 &&
    card.expiry.length === 5 &&
    card.cvv.length >= 3 &&
    card.name.trim().length > 1;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      const r = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), planId: plan.id }),
      });
      const data = await r.json();
      if (!r.ok) {
        setCouponError(data.error || "Invalid coupon");
        return;
      }
      setCoupon(data);
    } catch {
      setCouponError("Network error");
    } finally {
      setCouponBusy(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  function validateCard() {
    if (isFree) return true;
    if (method !== "card") return true;
    const errs: Record<string, string> = {};
    const digits = card.number.replace(/\s/g, "");
    if (digits.length < 12) errs.number = "Enter a valid card number";
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) errs.expiry = "MM/YY";
    else {
      const [mm, yy] = card.expiry.split("/").map((s) => Number(s));
      if (mm < 1 || mm > 12) errs.expiry = "Invalid month";
      const fullYear = 2000 + yy;
      const now = new Date();
      const exp = new Date(fullYear, mm, 0);
      if (exp < now) errs.expiry = "Card expired";
    }
    if (!/^\d{3,4}$/.test(card.cvv)) errs.cvv = "3–4 digits";
    if (card.name.trim().length < 2) errs.name = "Cardholder name required";
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function pay() {
    setPayError(null);
    if (!validateCard()) return;
    setPaying(true);
    try {
      const last4 = card.number.replace(/\s/g, "").slice(-4) || undefined;
      const r = await fetch("/api/checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          couponCode: coupon?.code,
          paymentMethod: isFree ? "free" : method,
          card:
            isFree || method !== "card"
              ? undefined
              : { last4, brand: cardBrand },
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setPayError(data.error || "Payment failed");
        return;
      }
      // Stash the order details for the success page
      sessionStorage.setItem("derma_last_order", JSON.stringify(data));
      router.push(`/subscription/success?id=${data.orderId}`);
    } catch {
      setPayError("Network error");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      {/* Left: forms */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Checkout</h1>

        {/* Coupon */}
        <Section icon={Tag} title="Coupon" subtitle="Have a code? Try DERMA100 for free demo access">
          {coupon ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 grid place-items-center text-emerald-700">
                <Check size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-emerald-800 text-sm">
                  {coupon.code} <span className="text-emerald-600">· {coupon.percentOff}% off</span>
                </div>
                <div className="text-xs text-emerald-700">{coupon.description}</div>
              </div>
              <button
                onClick={removeCoupon}
                className="text-xs text-emerald-700 hover:underline font-semibold"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  className="input uppercase tracking-wider font-semibold"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="ENTER CODE"
                />
                <button
                  onClick={applyCoupon}
                  className="btn-ghost"
                  disabled={couponBusy || !couponInput.trim()}
                >
                  {couponBusy ? "Checking…" : "Apply"}
                </button>
              </div>
              {couponError && (
                <div className="text-xs text-coral-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {couponError}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["DERMA100", "WELCOME50", "STUDENT25"].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCouponInput(c);
                    }}
                    className="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
        </Section>

        {/* Payment method */}
        {!isFree && (
          <Section icon={CreditCard} title="Payment method">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <MethodTab active={method === "card"} onClick={() => setMethod("card")} icon={CreditCard}>
                Card
              </MethodTab>
              <MethodTab active={method === "upi"} onClick={() => setMethod("upi")} icon={Smartphone}>
                UPI
              </MethodTab>
              <MethodTab
                active={method === "netbanking"}
                onClick={() => setMethod("netbanking")}
                icon={Building2}
              >
                Net Banking
              </MethodTab>
            </div>

            {method === "card" && (
              <div className="space-y-3">
                <div>
                  <label className="label">Card number</label>
                  <div className="relative">
                    <input
                      className={`input font-mono tracking-widest pr-16 ${cardErrors.number ? "border-coral-300" : ""}`}
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                      placeholder="1234 5678 9012 3456"
                      autoComplete="cc-number"
                      inputMode="numeric"
                    />
                    {cardBrand && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {cardBrand}
                      </span>
                    )}
                  </div>
                  {cardErrors.number && <FieldErr msg={cardErrors.number} />}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Expiry</label>
                    <input
                      className={`input font-mono ${cardErrors.expiry ? "border-coral-300" : ""}`}
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                      placeholder="MM/YY"
                      autoComplete="cc-exp"
                      inputMode="numeric"
                    />
                    {cardErrors.expiry && <FieldErr msg={cardErrors.expiry} />}
                  </div>
                  <div>
                    <label className="label">CVV</label>
                    <input
                      className={`input font-mono ${cardErrors.cvv ? "border-coral-300" : ""}`}
                      value={card.cvv}
                      onChange={(e) =>
                        setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })
                      }
                      placeholder="123"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      type="password"
                    />
                    {cardErrors.cvv && <FieldErr msg={cardErrors.cvv} />}
                  </div>
                </div>
                <div>
                  <label className="label">Cardholder name</label>
                  <input
                    className={`input ${cardErrors.name ? "border-coral-300" : ""}`}
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
                    placeholder="NAME ON CARD"
                    autoComplete="cc-name"
                  />
                  {cardErrors.name && <FieldErr msg={cardErrors.name} />}
                </div>
              </div>
            )}

            {method === "upi" && (
              <div className="space-y-3">
                <label className="label">UPI ID</label>
                <input className="input font-mono" placeholder="yourname@okhdfc" />
                <div className="flex gap-2">
                  {["GPay", "PhonePe", "Paytm", "BHIM"].map((p) => (
                    <button
                      key={p}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {method === "netbanking" && (
              <div>
                <label className="label">Select your bank</label>
                <select className="input">
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>State Bank of India</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                  <option>Yes Bank</option>
                </select>
              </div>
            )}
          </Section>
        )}

        {/* Billing details */}
        <Section icon={Building2} title="Billing details (optional)">
          <button
            onClick={() => setBillingOpen((o) => !o)}
            className="text-sm text-brand-700 font-semibold flex items-center gap-1"
          >
            {billingOpen ? "Hide" : "Add billing address"}{" "}
            <ChevronDown
              size={14}
              className={`transition ${billingOpen ? "rotate-180" : ""}`}
            />
          </button>
          {billingOpen && (
            <div className="space-y-3 mt-3">
              <div>
                <label className="label">Email</label>
                <input className="input" defaultValue={user.email} readOnly />
              </div>
              <div>
                <label className="label">Address</label>
                <input
                  className="input"
                  value={billingDetails.address1}
                  onChange={(e) => setBillingDetails({ ...billingDetails, address1: e.target.value })}
                  placeholder="Flat / House no, Street"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  className="input"
                  value={billingDetails.city}
                  onChange={(e) => setBillingDetails({ ...billingDetails, city: e.target.value })}
                  placeholder="City"
                />
                <input
                  className="input"
                  value={billingDetails.state}
                  onChange={(e) => setBillingDetails({ ...billingDetails, state: e.target.value })}
                  placeholder="State"
                />
                <input
                  className="input"
                  value={billingDetails.pincode}
                  onChange={(e) =>
                    setBillingDetails({
                      ...billingDetails,
                      pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                    })
                  }
                  placeholder="Pincode"
                />
              </div>
            </div>
          )}
        </Section>

        {payError && (
          <div className="rounded-xl bg-coral-100 text-coral-600 px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle size={14} /> {payError}
          </div>
        )}
      </div>

      {/* Right: order summary */}
      <aside className="lg:sticky lg:top-24 self-start space-y-4">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white p-5">
            <div className="text-xs uppercase tracking-wide font-semibold text-white/80 mb-1">
              Order summary
            </div>
            <div className="text-xl font-bold">DermAI Premium · {plan.label}</div>
            <div className="text-xs text-white/80 mt-1">
              {plan.durationDays} days of unlimited access
            </div>
          </div>
          <div className="p-5 space-y-3">
            <Row label="Base price (excl. GST)" value={`₹${baseExGst}`} />
            <Row label="GST (18%)" value={`₹${gst}`} />
            <Row label="Subtotal" value={`₹${plan.amountInr}`} bold />
            {coupon && (
              <Row
                label={`Coupon (${coupon.code})`}
                value={`−₹${coupon.discount}`}
                tint="text-emerald-700"
              />
            )}
            <div className="border-t border-slate-100 pt-3">
              <Row label="Total payable" value={`₹${total}`} large />
            </div>
            {isFree && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 flex items-center gap-2">
                <Sparkles size={14} /> Coupon makes this free — no payment needed.
              </div>
            )}
          </div>
        </div>

        <button
          onClick={pay}
          disabled={paying || (!isFree && method === "card" && !cardComplete)}
          className={`w-full py-4 rounded-2xl font-bold text-base transition shadow-lg ${
            isFree
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-brand hover:bg-brand-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
          }`}
        >
          {paying ? (
            "Processing…"
          ) : isFree ? (
            <span className="inline-flex items-center gap-2">
              <Sparkles size={16} /> Activate free
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Lock size={14} /> Pay ₹{total} securely
            </span>
          )}
        </button>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 flex items-start gap-2">
          <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            Your data is encrypted in transit. Payment processed securely. Cancel anytime from your
            profile.
          </div>
        </div>
      </aside>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center">
          <Icon size={16} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function MethodTab({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition ${
        active
          ? "bg-brand-50 border-brand-300 text-brand-700"
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon size={18} />
      {children}
    </button>
  );
}

function Row({
  label,
  value,
  bold,
  large,
  tint,
}: {
  label: string;
  value: string;
  bold?: boolean;
  large?: boolean;
  tint?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`text-slate-${bold ? "700 font-semibold" : "500"} ${tint ?? ""}`}>{label}</span>
      <span
        className={`${large ? "text-2xl font-bold text-slate-800" : bold ? "font-semibold text-slate-700" : "text-slate-700"} ${tint ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function FieldErr({ msg }: { msg: string }) {
  return (
    <div className="text-[11px] text-coral-600 mt-1 flex items-center gap-1">
      <X size={11} /> {msg}
    </div>
  );
}
