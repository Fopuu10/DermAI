import Link from "next/link";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeHealthScore } from "@/lib/health-score";
import {
  Camera,
  Microscope,
  Users,
  Sparkles,
  BookOpen,
  ChevronRight,
  Star,
  ArrowRight,
  Flame,
  TrendingUp,
  Award,
  Activity,
  Calendar,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const score = await recomputeHealthScore(user.id);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [
    recentScans,
    pendingFollowUps,
    weekScans,
    monthScans,
    journeys,
    badgeCount,
    trendingPosts,
    featuredArticle,
  ] = await Promise.all([
    prisma.diagnosisRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.followUp.findMany({
      where: { userId: user.id, status: "pending" },
      orderBy: { scheduledDate: "asc" },
      include: { originalDiagnosis: true },
      take: 3,
    }),
    prisma.diagnosisRecord.count({ where: { userId: user.id, createdAt: { gte: sevenDaysAgo } } }),
    prisma.diagnosisRecord.count({ where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.conditionJourney.findMany({ where: { userId: user.id } }),
    prisma.userAchievement.count({ where: { userId: user.id } }),
    prisma.communityPost.findMany({
      where: { status: "active" },
      orderBy: { upvotes: "desc" },
      take: 2,
      include: { user: { select: { fullName: true } }, _count: { select: { comments: true } } },
    }),
    prisma.article.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const premium = isPremium(user.subscription);
  const firstName = (user.fullName ?? user.email).split(" ")[0];
  const improving = journeys.filter((j) => j.trend === "improving").length;
  const totalScans = await prisma.diagnosisRecord.count({ where: { userId: user.id } });
  const lastScan = recentScans[0];

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-5">
      {/* HERO scan card — richer with stats */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white p-6 md:p-8">
        {/* Decorative shapes */}
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute right-32 -bottom-16 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-10 top-10 w-3 h-3 rounded-full bg-white/40" />
        <div className="absolute right-40 top-20 w-2 h-2 rounded-full bg-white/30" />
        <div className="absolute right-24 top-28 w-1.5 h-1.5 rounded-full bg-white/50" />

        <div className="relative grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium mb-3">
              <Sparkles size={14} /> Welcome back, {firstName}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.05] tracking-tight">
              Ready for your<br />daily skin check?
            </h1>
            <p className="text-white/85 text-sm mt-3 max-w-md font-medium">
              Take a quick scan to track changes and get personalized AI insights.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Link
                href="/scan"
                className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-cream transition"
              >
                <Camera size={16} /> Start New Scan
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/25 transition"
              >
                <Sparkles size={16} /> Ask Derma
              </Link>
            </div>
          </div>

          {/* Inline radial health score */}
          <div className="relative md:justify-self-end">
            <ScoreRing score={score.score} />
          </div>
        </div>
      </div>

      {/* 3-column stats trio */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label="Total Scans"
          value={totalScans.toString()}
          sub={`${weekScans} this week`}
          icon={Camera}
          tint="bg-brand-50 text-brand-700"
        />
        <StatTile
          label="Active Streak"
          value={`${Math.min(score.scanConsistency, 25) > 8 ? "7" : weekScans > 0 ? "3" : "0"}`}
          sub="days"
          icon={Flame}
          tint="bg-orange-50 text-orange-600"
          hot
        />
        <StatTile
          label="Conditions"
          value={journeys.length.toString()}
          sub={`${improving} improving`}
          icon={TrendingUp}
          tint="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* AI Insight strip */}
      {lastScan && (
        <Link
          href={`/history/${lastScan.id}`}
          className="block rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 border border-indigo-100 p-5 hover:shadow-md transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 grid place-items-center flex-shrink-0">
              <Activity size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                Latest insight
              </div>
              <div className="font-semibold text-slate-800 truncate">
                {lastScan.predictedCondition} detected on {lastScan.bodyPart}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {Math.round(lastScan.confidence * 100)}% confidence · {timeAgo(lastScan.createdAt)} ·
                {lastScan.safetyFlag ? " Recommended doctor visit" : " Track for changes"}
              </div>
            </div>
            <ArrowUpRight size={18} className="text-indigo-400" />
          </div>
        </Link>
      )}

      {/* Quick actions 2x2 — keep but richer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickLink href="/conditions" icon={Microscope} label="Condition Library" sub="15 conditions" tint="purple" />
        <QuickLink href="/community" icon={Users} label="Community" sub="Real stories" tint="teal" />
        <QuickLink href="/routines" icon={Sparkles} label="My Routines" sub={premium ? "Personalized" : "Premium"} tint="orange" />
        <QuickLink href="/learn" icon={BookOpen} label="Learn" sub="10 articles" tint="blue" />
      </div>

      {/* Two-column rich content row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pending follow-ups */}
        <div className="card p-5">
          <SectionHeader title="Follow-ups" href="/followups" badge={pendingFollowUps.length.toString()} />
          {pendingFollowUps.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No follow-ups pending"
              hint="Run a scan to schedule your first."
            />
          ) : (
            <div className="space-y-2">
              {pendingFollowUps.map((f) => {
                const days = Math.ceil(
                  (new Date(f.scheduledDate).getTime() - Date.now()) / (24 * 3600 * 1000),
                );
                return (
                  <Link
                    key={f.id}
                    href={`/followups/${f.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center flex-shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 truncate">
                        {f.originalDiagnosis.predictedCondition}
                      </div>
                      <div className="text-xs text-slate-400">
                        {days <= 0 ? "Due today" : `In ${days} day${days > 1 ? "s" : ""}`}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent scans */}
        <div className="card p-5">
          <SectionHeader title="Recent scans" href="/history" badge={totalScans.toString()} />
          {recentScans.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="No scans yet"
              hint="Take your first scan to start tracking."
            />
          ) : (
            <div className="space-y-2">
              {recentScans.map((s) => (
                <Link
                  key={s.id}
                  href={`/history/${s.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                >
                  <div
                    className={`w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 ${
                      s.safetyFlag ? "bg-coral-100 text-coral-600" : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    <Camera size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800 truncate">
                      {s.predictedCondition}
                    </div>
                    <div className="text-xs text-slate-400">
                      {s.bodyPart} · {timeAgo(s.createdAt)}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-brand-700">
                    {Math.round(s.confidence * 100)}%
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discover row — community + article */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <SectionHeader title="Trending in community" href="/community" />
          {trendingPosts.length === 0 ? (
            <EmptyState icon={MessageSquare} title="Quiet around here" hint="Be the first to post." />
          ) : (
            <div className="space-y-3">
              {trendingPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/community/${p.id}`}
                  className="block p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center justify-center min-w-[36px] py-1 rounded-lg bg-brand-50 text-brand-700">
                      <span className="text-[10px] font-medium">▲</span>
                      <span className="text-sm font-bold">{p.upvotes}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 line-clamp-1">{p.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {p.isAnonymous ? "Anonymous" : p.user.fullName ?? "User"} ·{" "}
                        {p._count.comments} comments · {timeAgo(p.createdAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {featuredArticle && (
          <Link
            href={`/learn/${featuredArticle.slug}`}
            className="card p-5 block hover:shadow-md transition group bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-orange-600" />
              <span className="text-xs uppercase tracking-wide font-semibold text-orange-700">
                Editor's pick
              </span>
            </div>
            <div className="font-extrabold text-slate-900 leading-snug group-hover:text-brand-700 transition">
              {featuredArticle.title}
            </div>
            <p className="text-xs text-slate-500 mt-2 line-clamp-3">{featuredArticle.excerpt}</p>
            <div className="text-xs font-semibold text-orange-700 mt-3 flex items-center gap-1">
              Read article <ArrowRight size={12} />
            </div>
          </Link>
        )}
      </div>

      {/* Premium banner */}
      {!premium && (
        <Link
          href="/subscription"
          className="block rounded-2xl bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 border border-amber-200 p-5 hover:shadow-md transition relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/40" />
          <div className="absolute right-20 -bottom-4 w-20 h-20 rounded-full bg-white/30" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white grid place-items-center text-amber-600 flex-shrink-0">
              <Star size={20} fill="currentColor" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-slate-900">Unlock DermAI Premium</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Unlimited scans, full history, expert chat, and personalized routines · ₹299/mo
              </div>
            </div>
            <ChevronRight size={18} className="text-amber-700" />
          </div>
        </Link>
      )}

      {/* Achievements peek */}
      {badgeCount > 0 && (
        <Link
          href="/profile"
          className="card p-5 flex items-center gap-3 hover:shadow-md transition"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-200 to-amber-400 text-amber-800 grid place-items-center">
            <Award size={20} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-800 text-sm">
              You've earned {badgeCount} {badgeCount === 1 ? "badge" : "badges"}
            </div>
            <div className="text-xs text-slate-500">Keep your streak going to unlock more</div>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </Link>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative w-44 h-44 md:w-52 md:h-52 grid place-items-center">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r={r} stroke="rgba(255,255,255,0.2)" strokeWidth="14" fill="none" />
        <circle
          cx="100"
          cy="100"
          r={r}
          stroke="white"
          strokeWidth="14"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
          Skin Score
        </div>
        <div className="text-5xl font-bold leading-none">{score}</div>
        <div className="text-[11px] text-white/70 mt-1">
          {score < 30 ? "Just getting started" : score < 70 ? "On track" : "Excellent"}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tint,
  hot = false,
}: {
  label: string;
  value: string;
  sub: string;
  icon: any;
  tint: string;
  hot?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg grid place-items-center ${tint}`}>
          <Icon size={16} />
        </div>
        {hot && Number(value) > 0 && <span className="text-base">🔥</span>}
      </div>
      <div className="text-2xl font-extrabold text-slate-900 leading-none">{value}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{label}</div>
      <div className="text-[10px] text-slate-500 mt-1.5">{sub}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  sub,
  tint,
}: {
  href: string;
  icon: any;
  label: string;
  sub: string;
  tint: "purple" | "teal" | "orange" | "blue";
}) {
  const tints: Record<string, { bg: string; text: string; arrow: string }> = {
    purple: { bg: "bg-purple-50", text: "text-purple-600", arrow: "text-purple-300" },
    teal: { bg: "bg-brand-50", text: "text-brand-700", arrow: "text-brand-300" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", arrow: "text-orange-300" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", arrow: "text-blue-300" },
  };
  const t = tints[tint];
  return (
    <Link
      href={href}
      className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition group relative overflow-hidden"
    >
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${t.bg} ${t.text}`}>
        <Icon size={18} />
      </div>
      <div className="font-semibold text-slate-800 text-sm mt-3">{label}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
      <ArrowUpRight
        size={14}
        className={`absolute top-4 right-4 ${t.arrow} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition`}
      />
    </Link>
  );
}

function SectionHeader({
  title,
  href,
  badge,
}: {
  title: string;
  href: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h3 className="font-extrabold text-slate-900">{title}</h3>
        {badge && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {badge}
          </span>
        )}
      </div>
      <Link
        href={href}
        className="text-xs text-brand-700 hover:underline flex items-center gap-1 font-medium"
      >
        View all <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: any; title: string; hint: string }) {
  return (
    <div className="text-center py-6">
      <div className="w-12 h-12 mx-auto rounded-xl bg-slate-50 grid place-items-center text-slate-400 mb-2">
        <Icon size={20} />
      </div>
      <div className="text-sm font-medium text-slate-700">{title}</div>
      <div className="text-xs text-slate-400 mt-0.5">{hint}</div>
    </div>
  );
}
