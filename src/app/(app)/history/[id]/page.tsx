import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJSON } from "@/lib/utils";
import { AlertTriangle, CheckCircle } from "lucide-react";
import BackButton from "@/components/BackButton";

export default async function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const r = await prisma.diagnosisRecord.findFirst({ where: { id, userId: user.id } });
  if (!r) notFound();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
      <BackButton href="/history" label="Back to history" />

      <div className={`card p-6 ${r.safetyFlag ? "border-coral-100 bg-coral-100/40" : ""}`}>
        <div className="flex items-center gap-2 mb-2">
          {r.safetyFlag ? (
            <AlertTriangle className="text-coral-600" size={20} />
          ) : (
            <CheckCircle className="text-brand-700" size={20} />
          )}
          <span className="text-xs uppercase tracking-wide text-slate-500">Suggested condition</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{r.predictedCondition}</h1>
        <div className="text-sm text-slate-500 mt-1">
          Confidence: {Math.round(r.confidence * 100)}% · {r.bodyPart} · {new Date(r.createdAt).toLocaleString()}
        </div>
        {r.imageUrl && <img src={r.imageUrl} className="rounded-xl mt-4 max-h-80 mx-auto" alt="" />}
        <p className="mt-4 text-sm text-slate-700 leading-relaxed">{r.description}</p>
      </div>

      <Section title="Possible effects" items={safeJSON<string[]>(r.possibleEffects, [])} />
      <Section title="Prevention" items={safeJSON<string[]>(r.prevention, [])} />
      <Section title="What might help" items={safeJSON<string[]>(r.solutions, [])} />

      <div className="card p-4 text-xs text-slate-500">{r.disclaimer}</div>

      <div className="grid grid-cols-2 gap-2">
        <Link href="/chat" className="btn-ghost">Ask Derma about this</Link>
        <Link href={`/consults/new?diagnosisId=${r.id}`} className="btn-coral">
          Get expert review (Premium)
        </Link>
      </div>
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
