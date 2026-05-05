import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sparkles, Camera, Users, MessageCircle, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-cream">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <LogoMark size={32} />
          <span className="font-bold text-slate-900 text-lg">DermAI</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/signup" className="btn-primary">Get started</Link>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 pt-12 md:pt-20 pb-12 text-center">
        <img src="/logo.jpg" alt="DermaAI" className="w-44 h-44 mx-auto mb-2 mix-blend-multiply" />
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight">
          Skin Diagnosis,<br />Intelligent Care.
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          Scan, get instant guidance, track your progress, and chat with Derma — your private AI skincare assistant. Built with safety and privacy first.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/signup" className="btn-primary">Start free</Link>
          <Link href="/library" className="btn-ghost">Explore conditions</Link>
        </div>
        <div className="mt-3 text-xs text-slate-400">No card required. Free plan includes 3 scans/month.</div>
      </section>

      <section className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-4 pb-20">
        <Feature icon={Camera} title="Instant AI Scan" body="Take or upload a photo. Get a clear, safety-first suggestion in seconds." />
        <Feature icon={MessageCircle} title="Chat with Derma" body="A conversational AI assistant trained on dermatology knowledge — and your skin history." />
        <Feature icon={Users} title="Real Community" body="Join skin-type circles, share progress, and learn from others on the same journey." />
        <Feature icon={ShieldCheck} title="Safety First" body="Concerning symptoms always nudge you toward a real dermatologist. No false confidence." />
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} DermAI · Not a medical device. Always consult a qualified dermatologist.
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="card p-6">
      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center mb-3">
        <Icon size={18} />
      </div>
      <div className="font-semibold text-slate-800">{title}</div>
      <div className="text-sm text-slate-500 mt-1">{body}</div>
    </div>
  );
}
