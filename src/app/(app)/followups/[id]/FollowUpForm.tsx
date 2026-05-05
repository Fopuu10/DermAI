"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowUpForm({ followUpId }: { followUpId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch(`/api/followups/${followUpId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfRating: rating, notes }),
      });
      router.push("/followups");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <div>
        <label className="label">How is your skin compared to before? (1 = worse, 5 = much better)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className={`flex-1 py-3 rounded-xl border ${
                rating === n
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <textarea
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What changed? Any new triggers?"
        />
      </div>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : "Submit follow-up"}
      </button>
    </form>
  );
}
