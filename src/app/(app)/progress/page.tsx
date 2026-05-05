import Link from "next/link";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeHealthScore } from "@/lib/health-score";
import PremiumGate from "@/components/PremiumGate";

export default async function ProgressPage() {
  const user = (await getCurrentUser())!;
  if (!isPremium(user.subscription)) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Progress</h1>
        <PremiumGate feature="Progress tracking" />
      </div>
    );
  }

  const score = await recomputeHealthScore(user.id);
  const [scans, journeys, completed] = await Promise.all([
    prisma.diagnosisRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.conditionJourney.findMany({ where: { userId: user.id } }),
    prisma.followUp.count({ where: { userId: user.id, status: "completed" } }),
  ]);

  const byCondition: Record<string, number> = {};
  for (const s of scans) byCondition[s.predictedCondition] = (byCondition[s.predictedCondition] || 0) + 1;
  const total = scans.length || 1;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Progress</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Total scans" value={scans.length} />
        <Stat label="Completed follow-ups" value={completed} />
        <Stat label="Health score" value={score.score} />
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Conditions tracked</h2>
        {journeys.length === 0 ? (
          <div className="text-sm text-slate-500">No conditions tracked yet — take a scan first.</div>
        ) : (
          <div className="space-y-2">
            {journeys.map((j) => (
              <div key={j.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                <div>
                  <div className="font-medium text-sm">{j.conditionName}</div>
                  <div className="text-xs text-slate-400">
                    First detected {new Date(j.firstDetected).toLocaleDateString()} · Last scan{" "}
                    {new Date(j.lastScanned).toLocaleDateString()}
                  </div>
                </div>
                <TrendBadge trend={j.trend} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Conditions distribution</h2>
        <div className="space-y-2">
          {Object.entries(byCondition).map(([name, count]) => (
            <div key={name}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{name}</span>
                <span className="text-slate-500">{count}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link href="/scan" className="btn-primary w-full text-center block">New scan</Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="text-3xl font-bold text-slate-800 mt-1">{value}</div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: string }) {
  const map: Record<string, string> = {
    improving: "bg-brand-50 text-brand-700",
    worsening: "bg-coral-100 text-coral-600",
    stable: "bg-slate-100 text-slate-600",
    resolved: "bg-brand-50 text-brand-700",
  };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${map[trend] ?? map.stable}`}>
      {trend}
    </span>
  );
}
