import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safeJSON } from "@/lib/utils";

export default async function ConditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.condition.findUnique({ where: { id } });
  if (!c) notFound();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
      <Link href="/library" className="text-xs text-slate-500">← Back to library</Link>
      <div className="card p-6">
        <h1 className="text-3xl font-bold text-slate-800">{c.name}</h1>
        <p className="text-sm text-slate-500 mt-2">{c.shortDescription}</p>
        <p className="mt-4 text-slate-700 leading-relaxed whitespace-pre-wrap">{c.longDescription}</p>
      </div>

      <Section title="Causes" items={safeJSON<string[]>(c.causes, [])} />
      <Section title="Risk factors" items={safeJSON<string[]>(c.riskFactors, [])} />
      <Section title="Prevention" items={safeJSON<string[]>(c.prevention, [])} />
      <Section title="General treatments" items={safeJSON<string[]>(c.treatmentsGeneral, [])} />
      <Section title="When to see a doctor" items={safeJSON<string[]>(c.whenToSeeDoctor, [])} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="card p-5">
      <div className="font-semibold text-slate-800 mb-2">{title}</div>
      <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
