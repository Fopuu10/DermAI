import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700 group"
    >
      <span className="w-8 h-8 rounded-full bg-white border border-slate-200 grid place-items-center group-hover:bg-brand-50 group-hover:border-brand-200 transition">
        <ArrowLeft size={14} />
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
