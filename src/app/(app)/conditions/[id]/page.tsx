import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { safeJSON } from "@/lib/utils";
import { Microscope, Clock, Activity, ShieldAlert, Pill, Eye, Sparkles } from "lucide-react";
import BackButton from "@/components/BackButton";

const TINTS = [
  "from-rose-100 to-rose-50 text-rose-700",
  "from-amber-100 to-amber-50 text-amber-700",
  "from-emerald-100 to-emerald-50 text-emerald-700",
  "from-sky-100 to-sky-50 text-sky-700",
  "from-purple-100 to-purple-50 text-purple-700",
  "from-orange-100 to-orange-50 text-orange-700",
  "from-pink-100 to-pink-50 text-pink-700",
];

export default async function ConditionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.condition.findUnique({ where: { id } });
  if (!c) notFound();

  const tags = safeJSON<string[]>(c.tags, []);
  const tintIdx = c.id.charCodeAt(0) % TINTS.length;
  const tint = TINTS[tintIdx];

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-4">
      <BackButton href="/conditions" label="Back to conditions" />

      {/* Hero card */}
      <div className={`rounded-3xl p-6 md:p-8 bg-gradient-to-br ${tint} relative overflow-hidden`}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/30" />
        <div className="absolute right-20 bottom-0 w-24 h-24 rounded-full bg-white/20" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/60 px-3 py-1 rounded-lg text-xs font-medium mb-3">
            <Microscope size={14} /> Condition
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{c.name}</h1>
          <p className="text-sm opacity-80 mt-2 max-w-xl">{c.shortDescription}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold ${
              c.chronic ? "bg-rose-200/60 text-rose-800" : "bg-emerald-200/60 text-emerald-800"
            }`}>
              <Clock size={11} /> {c.chronic ? "Chronic" : "Acute"}
            </span>
            {tags.map((t) => (
              <span key={t} className="text-xs px-3 py-1 rounded-full bg-white/60 font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Long description */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-800 mb-2">About</h2>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.longDescription}</p>
      </div>

      {/* Two-column factsheet */}
      <div className="grid md:grid-cols-2 gap-3">
        <Section
          title="Causes"
          items={safeJSON<string[]>(c.causes, [])}
          icon={Activity}
          tint="bg-rose-50 text-rose-700"
        />
        <Section
          title="Risk factors"
          items={safeJSON<string[]>(c.riskFactors, [])}
          icon={ShieldAlert}
          tint="bg-amber-50 text-amber-700"
        />
        <Section
          title="Prevention"
          items={safeJSON<string[]>(c.prevention, [])}
          icon={Sparkles}
          tint="bg-emerald-50 text-emerald-700"
        />
        <Section
          title="General treatments"
          items={safeJSON<string[]>(c.treatmentsGeneral, [])}
          icon={Pill}
          tint="bg-sky-50 text-sky-700"
        />
      </div>

      {/* When to see a doctor */}
      <Section
        title="When to see a doctor"
        items={safeJSON<string[]>(c.whenToSeeDoctor, [])}
        icon={Eye}
        tint="bg-coral-100 text-coral-600"
        full
      />

      <div className="card p-4 text-xs text-slate-500 text-center">
        AI-assisted education only — not a substitute for professional medical advice.
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  icon: Icon,
  tint,
  full = false,
}: {
  title: string;
  items: string[];
  icon: any;
  tint: string;
  full?: boolean;
}) {
  if (!items?.length) return null;
  return (
    <div className={`card p-5 ${full ? "md:col-span-2" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg grid place-items-center ${tint}`}>
          <Icon size={15} />
        </div>
        <div className="font-semibold text-slate-800">{title}</div>
      </div>
      <ul className="text-sm text-slate-600 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-slate-300">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
