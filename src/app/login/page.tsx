"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, User, Shield, Zap } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "free",
    label: "Free",
    sub: "Limited scans, basic chat",
    email: "free@dermai.app",
    icon: User,
    tint: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200",
  },
  {
    role: "premium",
    label: "Premium",
    sub: "Unlimited everything",
    email: "demo@dermai.app",
    icon: Sparkles,
    tint: "bg-gradient-to-br from-amber-100 to-orange-200 text-amber-800 hover:from-amber-200 hover:to-orange-300 border-amber-200",
    star: true,
  },
  {
    role: "admin",
    label: "Admin",
    sub: "Full dashboard access",
    email: "admin@dermai.app",
    icon: Shield,
    tint: "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState<string | null>(null);

  async function loginWith(email: string, password: string) {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Login failed");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await loginWith(form.email, form.password);
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin(role: string, email: string) {
    setErr(null);
    setDemoBusy(role);
    try {
      await loginWith(email, "password123");
      router.push(role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch (e: any) {
      setErr(e.message || "Demo login failed");
    } finally {
      setDemoBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-cream grid place-items-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 mb-3 inline-block">
          ← Back
        </Link>
        <div className="card p-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">Log in to DermAI.</p>

          {/* Quick demo access */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-50 border border-brand-100 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand text-white grid place-items-center">
                <Zap size={14} />
              </div>
              <div className="font-bold text-slate-800 text-sm">Quick demo access</div>
              <span className="ml-auto text-[10px] text-slate-500 font-medium">
                One-click login
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((a) => {
                const Icon = a.icon;
                const loading = demoBusy === a.role;
                return (
                  <button
                    key={a.role}
                    onClick={() => demoLogin(a.role, a.email)}
                    disabled={loading || busy}
                    className={`relative rounded-xl border p-3 text-center transition disabled:opacity-50 disabled:cursor-not-allowed ${a.tint}`}
                  >
                    {a.star && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-coral text-white text-[10px] font-bold grid place-items-center">
                        ★
                      </span>
                    )}
                    <Icon size={18} className="mx-auto mb-1" />
                    <div className="font-bold text-xs">{loading ? "Signing in…" : a.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-75 line-clamp-1">{a.sub}</div>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-slate-500 mt-3 text-center">
              All demo accounts use password{" "}
              <code className="font-mono bg-white border border-slate-200 rounded px-1 py-0.5">
                password123
              </code>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              or sign in manually
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>
            {err && (
              <div className="text-xs text-coral-600 bg-coral-100 rounded-xl p-2 font-medium">
                {err}
              </div>
            )}
            <button type="submit" className="btn-primary w-full py-3" disabled={busy || !!demoBusy}>
              {busy ? "Logging in…" : "Log in"}
            </button>
          </form>

          <div className="text-sm text-slate-500 mt-5 text-center">
            New here?{" "}
            <Link href="/signup" className="text-brand-700 hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
