import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import FollowUpForm from "./FollowUpForm";
import BackButton from "@/components/BackButton";

export default async function FollowUpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const followUp = await prisma.followUp.findFirst({
    where: { id, userId: user.id },
    include: { originalDiagnosis: true },
  });
  if (!followUp) notFound();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
      <BackButton href="/followups" label="Back to follow-ups" />
      <div className="card p-5">
        <div className="text-xs text-slate-400 uppercase tracking-wide">Follow-up</div>
        <h1 className="text-2xl font-bold text-slate-800">
          {followUp.originalDiagnosis.predictedCondition}
        </h1>
        <div className="text-sm text-slate-500 mt-1">
          Originally scanned {new Date(followUp.originalDiagnosis.createdAt).toLocaleDateString()} · Due{" "}
          {new Date(followUp.scheduledDate).toLocaleDateString()}
        </div>
        {followUp.originalDiagnosis.imageUrl && (
          <img src={followUp.originalDiagnosis.imageUrl} className="rounded-xl mt-4 max-h-60 mx-auto" alt="" />
        )}
      </div>
      {followUp.status === "completed" ? (
        <div className="card p-5 text-sm text-slate-600">
          ✅ Completed — rated {followUp.selfRating}/5
          {followUp.notes && <div className="mt-2">{followUp.notes}</div>}
        </div>
      ) : (
        <FollowUpForm followUpId={followUp.id} />
      )}
    </div>
  );
}
