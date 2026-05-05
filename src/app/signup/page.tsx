"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "Signup failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream grid place-items-center px-4">
      <div className="card p-8 w-full max-w-md">
        <Link href="/" className="text-xs text-slate-500">← Back</Link>
        <h1 className="text-2xl font-bold mt-3 text-slate-800">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">Free plan — 3 scans/month, no card needed.</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Password (min 8 chars)</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
          </div>
          {err && <div className="text-xs text-coral-600 bg-coral-100 rounded-xl p-2">{err}</div>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
        <div className="text-sm text-slate-500 mt-4 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-700 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
