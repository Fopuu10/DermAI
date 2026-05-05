"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Heart, X, ArrowRight, Camera, MessageCircle, Sparkles } from "lucide-react";
import Modal from "@/components/Modal";

const REASONS = [
  { id: "expensive", label: "Too expensive" },
  { id: "not_using", label: "Not using it enough" },
  { id: "missing_features", label: "Missing features I need" },
  { id: "switching", label: "Switching to another product" },
  { id: "issues", label: "Technical issues" },
  { id: "other", label: "Something else" },
];

export default function CancelButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"warn" | "reason" | "confirmed">("warn");
  const [reason, setReason] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setOpen(false);
    setStage("warn");
    setReason(null);
    setFeedback("");
  }

  async function confirmCancel() {
    setBusy(true);
    try {
      await fetch("/api/subscription/cancel", { method: "POST" });
      setStage("confirmed");
    } finally {
      setBusy(false);
    }
  }

  function done() {
    reset();
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-coral-600 hover:text-coral-700 font-medium underline-offset-2 hover:underline"
      >
        Cancel subscription
      </button>

      <Modal
        open={open}
        onClose={stage === "confirmed" ? done : reset}
        title={stage === "confirmed" ? "Subscription canceled" : "Cancel Premium?"}
        maxWidth="max-w-lg"
      >
        {stage === "warn" && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-coral-100 text-coral-600 grid place-items-center flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="font-semibold text-slate-800">You'll lose access to:</div>
                <ul className="space-y-2 mt-2">
                  <Lose icon={Camera} label="Unlimited AI scans (back to 3/month)" />
                  <Lose icon={Sparkles} label="Personalized routines" />
                  <Lose icon={MessageCircle} label="Unlimited chat with Derma (back to 10/day)" />
                  <Lose icon={Heart} label="Full scan history & expert reviews" />
                </ul>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-slate-700">
              Your Premium access remains active until the end of your current billing period —
              you can come back anytime.
            </div>

            <div className="flex gap-2">
              <button onClick={reset} className="btn-primary flex-1">
                Keep Premium
              </button>
              <button
                onClick={() => setStage("reason")}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm"
              >
                Continue to cancel
              </button>
            </div>
          </div>
        )}

        {stage === "reason" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              We'd love to know why so we can improve. Pick the closest reason:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    reason === r.id
                      ? "border-brand-300 bg-brand-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={() => setReason(r.id)}
                    className="accent-brand-600"
                  />
                  <span className="text-sm text-slate-700">{r.label}</span>
                </label>
              ))}
            </div>

            {reason && (
              <div>
                <label className="label">Anything else you want us to know? (optional)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Your feedback helps us build a better product."
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={reset} className="btn-primary flex-1">
                Keep Premium
              </button>
              <button
                onClick={confirmCancel}
                disabled={!reason || busy}
                className="px-4 py-2 rounded-xl bg-coral-100 hover:bg-coral text-coral-600 hover:text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {busy ? "Canceling…" : "Confirm cancel"}
              </button>
            </div>
          </div>
        )}

        {stage === "confirmed" && (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 grid place-items-center text-slate-500">
              <X size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-800">We'll miss you.</div>
              <p className="text-sm text-slate-500 mt-1">
                Your subscription is canceled. You'll keep Premium access until the end of your
                current billing period.
              </p>
            </div>
            {feedback && (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 italic text-left">
                "{feedback}"
              </div>
            )}
            <button onClick={done} className="btn-primary w-full">
              Got it <ArrowRight size={14} />
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

function Lose({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-slate-600">
      <X size={14} className="text-coral-500 flex-shrink-0" />
      <span className="text-slate-400 line-through">
        <Icon size={12} className="inline mr-1" />
        {label}
      </span>
    </li>
  );
}
