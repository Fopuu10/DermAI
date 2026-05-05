"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TAGS = ["acne", "eczema", "dandruff", "pigmentation", "rosacea", "dry skin", "oily skin"];

export default function NewPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    body: "",
    isAnonymous: false,
    tags: [] as string[],
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleTag(t: string) {
    setForm((p) =>
      p.tags.includes(t) ? { ...p, tags: p.tags.filter((x) => x !== t) } : { ...p, tags: [...p.tags, t] },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "Could not post");
        return;
      }
      router.push(`/community/${data.post.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Share with the community</h1>
      <form onSubmit={submit} className="card p-5 space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            minLength={3}
            maxLength={140}
          />
        </div>
        <div>
          <label className="label">Your story</label>
          <textarea
            className="input"
            rows={8}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Tags</label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`px-3 py-1 rounded-full text-xs border ${
                  form.tags.includes(t)
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={form.isAnonymous}
            onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
          />
          Post anonymously
        </label>
        {err && <div className="text-xs text-coral-600 bg-coral-100 rounded-xl p-2">{err}</div>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Posting…" : "Publish"}
        </button>
      </form>
    </div>
  );
}
