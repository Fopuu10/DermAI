import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Calendar, CheckCircle2 } from "lucide-react";

export default async function FollowUpsPage() {
  const user = (await getCurrentUser())!;
  const followUps = await prisma.followUp.findMany({
    where: { userId: user.id },
    include: { originalDiagnosis: true },
    orderBy: { scheduledDate: "asc" },
  });

  const pending = followUps.filter((f) => f.status === "pending");
  const completed = followUps.filter((f) => f.status === "completed");

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Follow-ups</h1>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Calendar size={16} /> Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="text-sm text-slate-500">All caught up.</div>
        ) : (
          <div className="space-y-2">
            {pending.map((f) => (
              <Link
                key={f.id}
                href={`/followups/${f.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50"
              >
                <div>
                  <div className="font-medium text-sm">{f.originalDiagnosis.predictedCondition}</div>
                  <div className="text-xs text-slate-400">
                    Due {new Date(f.scheduledDate).toLocaleDateString()}
                  </div>
                </div>
                <span className="chip-coral">Check in</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <CheckCircle2 size={16} /> Completed ({completed.length})
        </h2>
        {completed.length === 0 ? (
          <div className="text-sm text-slate-500">Complete a follow-up to see it here.</div>
        ) : (
          <div className="space-y-2">
            {completed.map((f) => (
              <div key={f.id} className="p-3 rounded-xl border border-slate-100">
                <div className="font-medium text-sm">{f.originalDiagnosis.predictedCondition}</div>
                <div className="text-xs text-slate-400">
                  Rated {f.selfRating}/5 · {f.completedDate && new Date(f.completedDate).toLocaleDateString()}
                </div>
                {f.notes && <div className="text-xs text-slate-600 mt-1">{f.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
