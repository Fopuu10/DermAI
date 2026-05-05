import Link from "next/link";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import {
  Lock,
  Camera,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Activity,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default async function HistoryPage() {
  const user = (await getCurrentUser())!;
  const premium = isPremium(user.subscription);
  const records = await prisma.diagnosisRecord.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: premium ? 200 : 3,
  });

  // Aggregate stats
  const totalScans = records.length;
  const uniqueConditions = new Set(records.map((r) => r.predictedCondition)).size;
  const avgConfidence = records.length
    ? Math.round((records.reduce((s, r) => s + r.confidence, 0) / records.length) * 100)
    : 0;
  const safetyAlerts = records.filter((r) => r.safetyFlag).length;

  // Group by month for timeline
  const byMonth: Record<string, typeof records> = {};
  for (const r of records) {
    const key = new Date(r.createdAt).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(r);
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-end justify-between">
        <div className="md:hidden">
          <h1 className="text-xl font-bold text-slate-800">History</h1>
          <p className="text-sm text-slate-500">
            {premium ? "Your full scan timeline" : `Free plan · last 3 of ${totalScans}`}
          </p>
        </div>
        <p className="hidden md:block text-sm text-slate-500">
          {premium ? "Your full scan timeline" : `Free plan · showing last 3 scans`}
        </p>
        {!premium && (
          <Link href="/subscription" className="btn-coral">
            <Lock size={14} /> Unlock all
          </Link>
        )}
      </div>

      {/* Stats trio */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total scans" value={totalScans.toString()} icon={Camera} tint="bg-brand-50 text-brand-700" />
          <Stat label="Conditions" value={uniqueConditions.toString()} icon={Activity} tint="bg-purple-50 text-purple-600" />
          <Stat
            label="Avg confidence"
            value={`${avgConfidence}%`}
            icon={TrendingUp}
            tint="bg-emerald-50 text-emerald-600"
          />
          <Stat
            label="Doctor alerts"
            value={safetyAlerts.toString()}
            icon={AlertTriangle}
            tint={safetyAlerts > 0 ? "bg-coral-100 text-coral-600" : "bg-slate-100 text-slate-500"}
          />
        </div>
      )}

      {records.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 grid place-items-center mb-3">
            <Camera size={28} className="text-brand-700" />
          </div>
          <div className="font-bold text-slate-800">No scans yet</div>
          <div className="text-sm text-slate-500 mt-1">
            Take your first scan to start your skin journey.
          </div>
          <Link href="/scan" className="btn-primary mt-4 inline-flex">
            Start a scan
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byMonth).map(([month, list]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <Calendar size={14} className="text-slate-400" />
                <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                  {month}
                </h2>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">
                  {list.length} scan{list.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="relative space-y-3 pl-6">
                {/* Vertical timeline line */}
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-slate-200" />
                {list.map((r) => (
                  <div key={r.id} className="relative">
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[19px] top-5 w-5 h-5 rounded-full border-4 border-cream ${
                        r.safetyFlag ? "bg-coral-500" : "bg-brand-500"
                      }`}
                    />
                    <Link
                      href={`/history/${r.id}`}
                      className="card p-4 flex items-center gap-4 hover:shadow-md transition group"
                    >
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                          alt=""
                        />
                      ) : (
                        <div
                          className={`w-14 h-14 rounded-xl grid place-items-center flex-shrink-0 ${
                            r.safetyFlag
                              ? "bg-coral-100 text-coral-600"
                              : "bg-brand-50 text-brand-700"
                          }`}
                        >
                          {r.safetyFlag ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 truncate">
                            {r.predictedCondition}
                          </span>
                          {r.safetyFlag && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-coral-100 text-coral-600 font-semibold">
                              See doctor
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 capitalize">
                          {r.bodyPart} · {timeAgo(r.createdAt)}
                        </div>
                        {/* Confidence bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[140px]">
                            <div
                              className={`h-full ${
                                r.safetyFlag ? "bg-coral-500" : "bg-brand-500"
                              }`}
                              style={{ width: `${r.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {Math.round(r.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition flex-shrink-0"
                      />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string;
  icon: any;
  tint: string;
}) {
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-lg grid place-items-center ${tint} mb-2`}>
        <Icon size={16} />
      </div>
      <div className="text-2xl font-bold text-slate-800 leading-none">{value}</div>
      <div className="text-[11px] text-slate-400 mt-1">{label}</div>
    </div>
  );
}
