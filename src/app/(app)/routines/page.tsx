import Link from "next/link";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJSON } from "@/lib/utils";
import {
  Sun,
  Moon,
  Droplet,
  FlaskConical,
  Sparkles,
  Shield,
  Scissors,
  CheckCircle2,
  Lock,
} from "lucide-react";
import GenerateButton from "./GenerateButton";

const STEP_ICONS: Record<string, any> = {
  cleanser: Droplet,
  treatment: FlaskConical,
  moisturizer: Sparkles,
  sunscreen: Shield,
  scalp_care: Scissors,
};

export default async function RoutinesPage() {
  const user = (await getCurrentUser())!;
  const premium = isPremium(user.subscription);
  const routines = await prisma.routine.findMany({ where: { userId: user.id } });
  const morning = routines.find((r) => r.type === "morning");
  const night = routines.find((r) => r.type === "night");
  const profileComplete = Boolean(user.profile?.skinType);

  const totalSteps =
    safeJSON<any[]>(morning?.steps ?? null, []).length +
    safeJSON<any[]>(night?.steps ?? null, []).length;

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto space-y-5">
      <div className="md:hidden">
        <h1 className="text-xl font-bold text-slate-800">My Routines</h1>
        <p className="text-sm text-slate-500">AI-personalized skincare routines</p>
      </div>
      <p className="hidden md:block text-sm text-slate-500">
        AI-personalized skincare routines · tailored to your{" "}
        <span className="font-semibold text-slate-700 capitalize">
          {user.profile?.skinType ?? "skin"}
        </span>{" "}
        skin
      </p>

      {/* Hero stats card (only when there's something to show) */}
      {totalSteps > 0 && premium && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-emerald-600 text-white p-6 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute right-20 -bottom-8 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold">{totalSteps}</div>
              <div className="text-xs text-white/70 mt-1">Total steps</div>
            </div>
            <div>
              <div className="text-3xl font-bold">2</div>
              <div className="text-xs text-white/70 mt-1">Daily routines</div>
            </div>
            <div>
              <div className="text-3xl font-bold">7d</div>
              <div className="text-xs text-white/70 mt-1">Streak</div>
            </div>
          </div>
        </div>
      )}

      {!profileComplete && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-slate-700 flex items-center gap-3">
          <Sparkles size={16} className="text-blue-600 flex-shrink-0" />
          <span>
            Complete your{" "}
            <Link href="/profile" className="text-brand-700 font-semibold underline">
              skin profile
            </Link>{" "}
            for more personalized routines.
          </span>
        </div>
      )}

      <RoutineCard
        title="Morning Routine"
        subtitle="Protect & prep"
        icon={Sun}
        gradient="from-orange-400 via-orange-500 to-rose-500"
        steps={morning ? safeJSON<any[]>(morning.steps, []) : null}
        type="morning"
        premium={premium}
      />

      <RoutineCard
        title="Night Routine"
        subtitle="Repair & restore"
        icon={Moon}
        gradient="from-purple-500 via-indigo-600 to-blue-700"
        steps={night ? safeJSON<any[]>(night.steps, []) : null}
        type="night"
        premium={premium}
      />

      {!premium && (
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200 p-6 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/40" />
          <div className="relative">
            <div className="w-12 h-12 mx-auto rounded-xl bg-white grid place-items-center text-amber-600 mb-3">
              <Lock size={20} />
            </div>
            <div className="font-bold text-slate-800">Routines are a Premium feature</div>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Upgrade to generate personalized AI routines tailored to your skin type, condition history,
              and concerns.
            </p>
            <Link href="/subscription" className="btn-coral mt-4 inline-flex">
              <Sparkles size={14} /> Upgrade for ₹299/mo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function RoutineCard({
  title,
  subtitle,
  icon: Icon,
  gradient,
  steps,
  type,
  premium,
}: {
  title: string;
  subtitle: string;
  icon: any;
  gradient: string;
  steps: any[] | null;
  type: "morning" | "night";
  premium: boolean;
}) {
  return (
    <div className="card overflow-hidden p-0">
      <div className={`bg-gradient-to-r ${gradient} text-white px-6 py-5 relative overflow-hidden`}>
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/15" />
        <div className="absolute right-20 -bottom-6 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
              <Icon size={20} />
            </div>
            <div>
              <div className="font-bold text-lg">{title}</div>
              <div className="text-xs text-white/80">{subtitle}</div>
            </div>
          </div>
          {premium && <GenerateButton type={type} />}
        </div>
      </div>
      <div className="p-6">
        {!steps || steps.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-sm text-slate-500">No {type} routine yet</div>
            {premium && <GenerateInline type={type} />}
          </div>
        ) : (
          <ol className="space-y-3">
            {steps.map((s: any, i: number) => {
              const StepIcon = STEP_ICONS[s.step_type] ?? Sparkles;
              return (
                <li
                  key={i}
                  className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center">
                      <StepIcon size={16} />
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 grid place-items-center text-[10px] font-bold text-slate-600">
                      {s.step_number ?? i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                      {(s.step_type ?? "step").replace("_", " ")}
                    </div>
                    <div className="text-sm text-slate-700 leading-snug">{s.description}</div>
                  </div>
                  <button className="opacity-30 hover:opacity-100 transition" aria-label="Mark done">
                    <CheckCircle2 size={20} className="text-brand-600" />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function GenerateInline({ type }: { type: "morning" | "night" }) {
  return <GenerateButton type={type} variant="inline" />;
}
