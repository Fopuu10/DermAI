import Link from "next/link";
import { Sparkles, Lock } from "lucide-react";

export default function PremiumGate({ feature }: { feature: string }) {
  return (
    <div className="card p-6 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-coral-100 text-coral grid place-items-center mx-auto mb-3">
        <Lock size={20} />
      </div>
      <h3 className="font-semibold text-slate-800 mb-1">{feature} is a Premium feature</h3>
      <p className="text-sm text-slate-500 mb-4">
        Upgrade to unlock unlimited scans, full history, expert chat, personalized routines, and more.
      </p>
      <Link href="/subscription" className="btn-coral">
        <Sparkles size={16} /> Upgrade to Premium
      </Link>
    </div>
  );
}
