import Link from "next/link";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJSON, timeAgo } from "@/lib/utils";
import {
  Star,
  Camera,
  Award,
  Flame,
  Trophy,
  MessageCircle,
  Sparkles,
  Calendar,
  CreditCard,
  Shield,
  Stethoscope,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Download,
  AlertCircle,
  Mail,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import ProfileForm from "./ProfileForm";
import CancelButton from "../subscription/CancelButton";
import LogoutButton from "@/components/LogoutButton";

const BADGE_ICONS: Record<string, any> = {
  camera: Camera,
  flame: Flame,
  users: MessageCircle,
  trophy: Trophy,
  award: Award,
  sparkles: Sparkles,
};

export default async function ProfilePage() {
  const user = (await getCurrentUser())!;
  const concerns = safeJSON<string[]>(user.profile?.concerns ?? null, []);
  const premium = isPremium(user.subscription);
  const initial = (user.fullName ?? user.email)[0]?.toUpperCase() ?? "U";

  const [scanCount, achievements, allBadges, journeys, lastTransaction, derm, lastScan] =
    await Promise.all([
      prisma.diagnosisRecord.count({ where: { userId: user.id } }),
      prisma.userAchievement.findMany({
        where: { userId: user.id },
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      }),
      prisma.badge.findMany(),
      prisma.conditionJourney.findMany({
        where: { userId: user.id },
        orderBy: { lastScanned: "desc" },
      }),
      prisma.paymentTransaction.findFirst({
        where: { userId: user.id, status: "success" },
        orderBy: { createdAt: "desc" },
      }),
      // Assign first available dermatologist as care provider
      prisma.dermatologist.findFirst({ where: { isAvailable: true } }),
      prisma.diagnosisRecord.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const earnedIds = new Set(achievements.map((a) => a.badgeId));
  const memberSince = new Date(user.createdAt);
  const memberDays = Math.floor((Date.now() - memberSince.getTime()) / (24 * 3600 * 1000));

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-5">
      {/* Hero card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-emerald-700 text-white p-6 md:p-8 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white text-brand-700 grid place-items-center text-3xl font-bold shadow-lg">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-2xl uppercase tracking-tight">{user.fullName ?? "User"}</div>
            <div className="text-sm text-white/80 truncate flex items-center gap-1.5 mt-0.5">
              <Mail size={12} /> {user.email}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {premium && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">
                  <Star size={12} fill="currentColor" /> Premium Member
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium">
                <Calendar size={11} /> Member for {memberDays} day{memberDays === 1 ? "" : "s"}
              </span>
              {user.profile?.skinType && (
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium capitalize">
                  {user.profile.skinType} skin
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20 relative">
          <HeroStat label="Scans" value={scanCount.toString()} />
          <HeroStat label="Badges" value={`${achievements.length}/${allBadges.length}`} />
          <HeroStat
            label="Conditions"
            value={journeys.length.toString()}
          />
          <HeroStat label="Plan" value={premium ? "Pro" : "Free"} />
        </div>
      </div>

      {/* Subscription billing card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center">
            <CreditCard size={18} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800">Subscription</h2>
            <p className="text-xs text-slate-500">Billing & plan management</p>
          </div>
          {!premium && (
            <Link href="/subscription" className="btn-coral">
              <Sparkles size={14} /> Upgrade
            </Link>
          )}
        </div>

        {premium && user.subscription ? (
          <div className="space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <BillingCell
                label="Plan"
                value={user.subscription.planId.replace("premium_", "").replace(/^./, (c) => c.toUpperCase())}
                accent
              />
              <BillingCell
                label="Next billing"
                value={new Date(user.subscription.endDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />
              <BillingCell label="Amount" value={`₹${user.subscription.amount} / ${user.subscription.planId === "premium_yearly" ? "year" : user.subscription.planId === "premium_quarterly" ? "qtr" : "month"}`} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <BillingCell
                label="Payment method"
                value={lastTransaction
                  ? lastTransaction.provider === "razorpay"
                    ? "Razorpay (UPI/Card)"
                    : "Mock checkout"
                  : "—"}
                icon={CreditCard}
              />
              <BillingCell
                label="Status"
                value={
                  user.subscription.autoRenew && user.subscription.status === "active"
                    ? "Active · Auto-renew on"
                    : user.subscription.status === "canceled"
                      ? "Cancels at period end"
                      : user.subscription.status
                }
                icon={CheckCircle2}
                ok={user.subscription.status === "active"}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
              <Link href="/subscription" className="btn-ghost text-sm">
                Manage plan
              </Link>
              <button className="btn-ghost text-sm">
                <Download size={14} /> Invoice history
              </button>
              <div className="ml-auto">
                {user.subscription.status === "active" && <CancelButton />}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-4">
            <div className="text-sm text-slate-700">
              You're on the <strong>Free plan</strong> — 3 scans/month, last 3 history, 10 chat messages/day.
            </div>
            <div className="text-xs text-slate-500 mt-1">Upgrade to Premium for ₹299/mo to unlock everything.</div>
          </div>
        )}
      </div>

      {/* Two column: Dermatologist + Journey */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Assigned Dermatologist */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
              <Stethoscope size={18} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-slate-800">Care provider</h2>
              <p className="text-xs text-slate-500">Your assigned dermatologist</p>
            </div>
          </div>
          {derm ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 text-emerald-700 grid place-items-center font-bold text-lg flex-shrink-0">
                  {derm.name.split(" ").slice(-1)[0][0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800">{derm.name}</div>
                  <div className="text-xs text-slate-500">{derm.credentials}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{derm.specialization}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                    Response time
                  </div>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Clock size={12} /> ~{derm.responseTimeHours}h
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-emerald-600 font-semibold">
                    Status
                  </div>
                  <div className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                  </div>
                </div>
              </div>
              <button
                disabled={!premium}
                className={`w-full ${premium ? "btn-primary" : "btn-ghost cursor-not-allowed"} text-sm`}
              >
                <MessageCircle size={14} /> {premium ? "Request consultation" : "Premium only"}
              </button>
              {!premium && (
                <p className="text-[11px] text-slate-400 text-center">
                  Upgrade to message a dermatologist directly.
                </p>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500 text-center py-4">
              No dermatologist available right now.
            </div>
          )}
        </div>

        {/* Skin Journey */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 grid place-items-center">
              <Activity size={18} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-slate-800">Skin journey</h2>
              <p className="text-xs text-slate-500">Conditions you're tracking</p>
            </div>
          </div>
          {journeys.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-sm text-slate-500">No conditions tracked yet.</div>
              <Link href="/scan" className="text-xs text-brand-700 underline mt-1 inline-block">
                Run a scan to start
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {journeys.slice(0, 4).map((j) => (
                <JourneyRow key={j.id} journey={j} />
              ))}
              {journeys.length > 4 && (
                <div className="text-center pt-2">
                  <Link href="/progress" className="text-xs text-brand-700 hover:underline">
                    View all {journeys.length} →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center">
              <Award size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Achievements</h2>
              <p className="text-xs text-slate-500">
                {achievements.length} of {allBadges.length} unlocked
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-600">
              {Math.round((achievements.length / Math.max(1, allBadges.length)) * 100)}%
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
              Complete
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {allBadges.map((b) => {
            const Icon = BADGE_ICONS[b.icon] ?? Award;
            const earned = earnedIds.has(b.id);
            return (
              <div
                key={b.id}
                className={`text-center rounded-2xl p-3 border ${
                  earned
                    ? "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
                    : "bg-slate-50 border-slate-100 opacity-50"
                }`}
              >
                <div
                  className={`w-12 h-12 mx-auto rounded-full grid place-items-center mb-2 ${
                    earned
                      ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 shadow"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div
                  className={`text-[11px] font-bold ${earned ? "text-slate-800" : "text-slate-400"}`}
                >
                  {b.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                  {b.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      {lastScan && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-800 mb-4">Recent activity</h2>
          <div className="space-y-3">
            {achievements.slice(0, 2).map((a) => (
              <ActivityRow
                key={a.id}
                icon={Award}
                tint="bg-amber-50 text-amber-600"
                title={`Earned "${a.badge.name}"`}
                sub={timeAgo(a.earnedAt)}
              />
            ))}
            <ActivityRow
              icon={Camera}
              tint="bg-brand-50 text-brand-700"
              title={`Scanned: ${lastScan.predictedCondition}`}
              sub={`${lastScan.bodyPart} · ${timeAgo(lastScan.createdAt)}`}
            />
          </div>
        </div>
      )}

      {/* Skin Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Skin Profile</h2>
            <p className="text-xs text-slate-500">Helps personalize routines and Derma's answers</p>
          </div>
        </div>
        <ProfileForm
          initial={{
            fullName: user.fullName ?? "",
            age: user.profile?.age ?? null,
            gender: (user.profile?.gender as any) ?? "",
            skinType: (user.profile?.skinType as any) ?? "",
            concerns,
          }}
        />
      </div>

      {/* Privacy & Data */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 grid place-items-center">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Privacy & Data</h2>
            <p className="text-xs text-slate-500">Manage your data and account</p>
          </div>
        </div>
        <div className="space-y-2">
          <SettingsRow
            icon={Download}
            title="Export your data"
            sub="Download all your scans, posts, and chats as JSON"
            action="Request"
          />
          <SettingsRow
            icon={Mail}
            title="Email preferences"
            sub="Newsletter, follow-up reminders, community digests"
            action="Manage"
          />
          <SettingsRow
            icon={AlertCircle}
            title="Delete account"
            sub="Permanently delete your account and all associated data"
            action="Delete"
            danger
          />
        </div>
      </div>

      {/* Logout */}
      <div className="text-center pb-4">
        <LogoutButton variant="full" />
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-white/70 font-semibold mt-1">
        {label}
      </div>
    </div>
  );
}

function BillingCell({
  label,
  value,
  icon: Icon,
  ok = false,
  accent = false,
}: {
  label: string;
  value: string;
  icon?: any;
  ok?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div
        className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
          ok ? "text-emerald-700" : accent ? "text-brand-700" : "text-slate-800"
        }`}
      >
        {Icon && <Icon size={13} />}
        <span className="capitalize">{value}</span>
      </div>
    </div>
  );
}

function JourneyRow({ journey }: { journey: any }) {
  const trend = journey.trend as string;
  const trendStyles: Record<string, { tint: string; icon: any; label: string }> = {
    improving: { tint: "bg-emerald-50 text-emerald-700", icon: TrendingUp, label: "Improving" },
    worsening: { tint: "bg-coral-100 text-coral-600", icon: TrendingDown, label: "Worsening" },
    stable: { tint: "bg-slate-100 text-slate-500", icon: Minus, label: "Stable" },
    resolved: { tint: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Resolved" },
  };
  const t = trendStyles[trend] ?? trendStyles.stable;
  const TIcon = t.icon;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-slate-800 truncate">{journey.conditionName}</div>
        <div className="text-xs text-slate-400">
          Tracking since {new Date(journey.firstDetected).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
        </div>
      </div>
      <span
        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold ${t.tint}`}
      >
        <TIcon size={11} /> {t.label}
      </span>
    </div>
  );
}

function ActivityRow({
  icon: Icon,
  tint,
  title,
  sub,
}: {
  icon: any;
  tint: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
      <div className={`w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 ${tint}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{title}</div>
        <div className="text-xs text-slate-400">{sub}</div>
      </div>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  sub,
  action,
  danger = false,
}: {
  icon: any;
  title: string;
  sub: string;
  action: string;
  danger?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
        danger
          ? "border-coral-100 hover:bg-coral-100/30"
          : "border-slate-100 hover:bg-slate-50"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 ${
          danger ? "bg-coral-100 text-coral-600" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${danger ? "text-coral-600" : "text-slate-800"}`}>
          {title}
        </div>
        <div className="text-xs text-slate-400 truncate">{sub}</div>
      </div>
      <div
        className={`text-xs font-semibold flex items-center gap-1 ${
          danger ? "text-coral-600" : "text-slate-500"
        }`}
      >
        {action} <ChevronRight size={12} />
      </div>
    </button>
  );
}
