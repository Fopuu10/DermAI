import { Sparkles } from "lucide-react";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded-xl bg-brand text-white grid place-items-center shadow-sm"
      style={{ width: size, height: size }}
    >
      <Sparkles size={size * 0.55} />
    </div>
  );
}

export function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <LogoMark />
      <span className="font-bold text-slate-900 text-lg tracking-tight">DermAI</span>
    </div>
  );
}
