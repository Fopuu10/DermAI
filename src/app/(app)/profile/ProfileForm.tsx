"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

const SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"] as const;
const CONCERNS = [
  "acne",
  "pigmentation",
  "dandruff",
  "eczema",
  "dryness",
  "oiliness",
  "rosacea",
  "anti-aging",
  "sensitivity",
  "psoriasis",
];

export default function ProfileForm({
  initial,
}: {
  initial: {
    fullName: string;
    age: number | null;
    gender: string;
    skinType: string;
    concerns: string[];
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleConcern(c: string) {
    setForm((p) =>
      p.concerns.includes(c)
        ? { ...p, concerns: p.concerns.filter((x) => x !== c) }
        : { ...p, concerns: [...p.concerns, c] },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName || undefined,
          age: form.age ?? undefined,
          gender: form.gender || undefined,
          skinType: form.skinType || undefined,
          concerns: form.concerns,
        }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="label">Age</label>
          <input
            type="number"
            className="input"
            value={form.age ?? ""}
            placeholder="Your age"
            onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
        <div>
          <label className="label">Gender</label>
          <select
            className="input"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Skin Type</label>
        <div className="flex flex-wrap gap-2">
          {SKIN_TYPES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setForm({ ...form, skinType: t })}
              className={`px-4 py-1.5 rounded-full text-sm border transition capitalize ${
                form.skinType === t
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Main Concerns</label>
        <div className="flex flex-wrap gap-2">
          {CONCERNS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => toggleConcern(c)}
              className={`px-4 py-1.5 rounded-full text-sm border transition capitalize ${
                form.concerns.includes(c)
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {saved && <div className="text-xs text-brand-700">Saved.</div>}

      <button className="btn-primary w-full py-3 text-base" disabled={busy}>
        <Save size={16} /> {busy ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}
