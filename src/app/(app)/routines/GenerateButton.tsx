"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ArrowRight } from "lucide-react";

export default function GenerateButton({
  type,
  variant = "header",
}: {
  type: "morning" | "night";
  variant?: "header" | "inline";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      // Use the user's most recent diagnosis as the basis if available; otherwise generic
      const meRes = await fetch("/api/history");
      const meData = await meRes.json();
      const condition = meData.records?.[0]?.predictedCondition ?? "general skincare";
      const r = await fetch("/api/routines/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "Could not generate");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (variant === "inline") {
    return (
      <button onClick={generate} className="text-brand-700 font-medium text-sm mt-2 inline-flex items-center gap-1" disabled={busy}>
        {busy ? "Generating…" : "Generate with AI"} <ArrowRight size={14} />
        {err && <span className="ml-2 text-coral-600 text-xs">{err}</span>}
      </button>
    );
  }

  return (
    <button
      onClick={generate}
      className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
      disabled={busy}
    >
      <RefreshCw size={12} className={busy ? "animate-spin" : ""} /> {busy ? "Generating…" : "Generate"}
    </button>
  );
}
