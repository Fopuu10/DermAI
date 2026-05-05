import Link from "next/link";
import { prisma } from "@/lib/db";
import { safeJSON } from "@/lib/utils";
import {
  Search,
  ChevronRight,
  Sparkles,
  Activity,
  Droplet,
  Microscope,
  Bug,
  Sun,
  Layers,
  Zap,
  Wind,
  Bandage,
  Star,
} from "lucide-react";

// Map condition tags → category icon + color identity
const CATEGORY_ICONS: { match: RegExp; icon: any; tint: string; gradient: string; category: string }[] = [
  { match: /acne/i, icon: Activity, tint: "bg-rose-100 text-rose-600", gradient: "from-rose-400 to-pink-600", category: "Inflammatory" },
  { match: /eczema|dermatitis/i, icon: Droplet, tint: "bg-amber-100 text-amber-600", gradient: "from-amber-400 to-orange-500", category: "Inflammatory" },
  { match: /pigment|melasma/i, icon: Sun, tint: "bg-orange-100 text-orange-600", gradient: "from-orange-400 to-rose-500", category: "Pigment" },
  { match: /vitiligo/i, icon: Layers, tint: "bg-slate-100 text-slate-600", gradient: "from-slate-300 to-slate-500", category: "Pigment" },
  { match: /psoriasis/i, icon: Bandage, tint: "bg-purple-100 text-purple-600", gradient: "from-purple-400 to-fuchsia-600", category: "Autoimmune" },
  { match: /rosacea/i, icon: Wind, tint: "bg-pink-100 text-pink-600", gradient: "from-pink-400 to-rose-600", category: "Inflammatory" },
  { match: /tinea|fungal|athlete/i, icon: Bug, tint: "bg-emerald-100 text-emerald-600", gradient: "from-emerald-400 to-teal-600", category: "Fungal" },
  { match: /dandruff|seborr/i, icon: Layers, tint: "bg-sky-100 text-sky-600", gradient: "from-sky-400 to-cyan-600", category: "Inflammatory" },
  { match: /urticaria|hive/i, icon: Zap, tint: "bg-yellow-100 text-yellow-600", gradient: "from-yellow-400 to-amber-500", category: "Allergic" },
  { match: /keratosis/i, icon: Layers, tint: "bg-indigo-100 text-indigo-600", gradient: "from-indigo-400 to-blue-600", category: "Other" },
  { match: /cold sore|herpes/i, icon: Microscope, tint: "bg-red-100 text-red-600", gradient: "from-red-400 to-rose-600", category: "Viral" },
];

const CATEGORIES = ["All", "Inflammatory", "Pigment", "Autoimmune", "Fungal", "Allergic", "Viral", "Other"];

function styleFor(name: string) {
  for (const s of CATEGORY_ICONS) if (s.match.test(name)) return s;
  return { icon: Microscope, tint: "bg-slate-100 text-slate-600", gradient: "from-slate-400 to-slate-600", category: "Other" };
}

export default async function ConditionsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const all = await prisma.condition.findMany({ orderBy: { name: "asc" } });
  const conditions = !cat || cat === "All"
    ? all
    : all.filter((c) => styleFor(c.name).category.toLowerCase() === cat.toLowerCase());

  // Pick a "featured" condition — first chronic one (or first one)
  const featured = all.find((c) => c.chronic) ?? all[0];

  // Counts per category
  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = c === "All" ? all.length : all.filter((co) => styleFor(co.name).category === c).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-5">
      <div className="md:hidden">
        <h1 className="text-xl font-bold text-slate-800">Condition Library</h1>
      </div>
      <p className="hidden md:block text-sm text-slate-500">
        {all.length} conditions, structured by category
      </p>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          placeholder="Search conditions, symptoms, or tags..."
        />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
        {CATEGORIES.map((c) => {
          const active = (!cat && c === "All") || cat?.toLowerCase() === c.toLowerCase();
          return (
            <Link
              key={c}
              href={c === "All" ? "/conditions" : `/conditions?cat=${c}`}
              className={`px-4 py-1.5 rounded-full text-sm border whitespace-nowrap transition flex items-center gap-2 ${
                active
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {c}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? "bg-white/20" : "bg-slate-100 text-slate-500"
                }`}
              >
                {catCounts[c]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Featured spotlight (only on All) */}
      {(!cat || cat === "All") && featured && <FeaturedCondition condition={featured} />}

      {/* Conditions grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {conditions
          .filter((c) => c.id !== ((!cat || cat === "All") ? featured?.id : undefined))
          .map((c) => (
            <ConditionCard key={c.id} condition={c} />
          ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white p-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute right-20 -bottom-8 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
            <Sparkles size={20} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">Not sure what you have?</div>
            <p className="text-sm text-white/80 mt-0.5">
              Run an AI scan to get a personalized suggestion in seconds.
            </p>
          </div>
          <Link
            href="/scan"
            className="bg-white text-brand-700 font-semibold px-4 py-2 rounded-xl hover:bg-cream transition"
          >
            Start scan
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeaturedCondition({ condition }: { condition: any }) {
  const style = styleFor(condition.name);
  const Icon = style.icon;
  const tags = safeJSON<string[]>(condition.tags, []);
  return (
    <Link
      href={`/conditions/${condition.id}`}
      className="block rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition group"
    >
      <div className="grid md:grid-cols-2">
        <div className={`relative bg-gradient-to-br ${style.gradient} p-8 min-h-[180px] grid place-items-center`}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/15" />
          <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative w-20 h-20 rounded-2xl bg-white/20 backdrop-blur grid place-items-center">
            <Icon size={36} className="text-white" strokeWidth={1.5} />
          </div>
          <span className="absolute top-4 left-4 inline-flex items-center gap-1 bg-white/90 text-slate-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
            <Star size={10} fill="currentColor" className="text-amber-500" /> Spotlight
          </span>
        </div>
        <div className="p-6 flex flex-col justify-center">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase tracking-wide">
              {style.category}
            </span>
            {condition.chronic && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-medium">
                Chronic
              </span>
            )}
            {tags.slice(0, 2).map((t) => (
              <span key={t} className="chip capitalize">
                {t}
              </span>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 group-hover:text-brand-700 transition">
            {condition.name}
          </h2>
          <p className="text-sm text-slate-500 mt-2 line-clamp-3">{condition.shortDescription}</p>
          <div className="flex items-center gap-1 text-xs font-semibold text-brand-700 mt-4">
            Read details <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function ConditionCard({ condition }: { condition: any }) {
  const style = styleFor(condition.name);
  const Icon = style.icon;
  const tags = safeJSON<string[]>(condition.tags, []);

  return (
    <Link
      href={`/conditions/${condition.id}`}
      className="card p-5 hover:shadow-md transition group flex items-start gap-4"
    >
      <div className={`w-12 h-12 rounded-xl ${style.tint} grid place-items-center flex-shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
            {style.category}
          </span>
          {condition.chronic && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-medium">
              Chronic
            </span>
          )}
        </div>
        <h3 className="font-bold text-slate-800 group-hover:text-brand-700 transition">
          {condition.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{condition.shortDescription}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="chip capitalize">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight
        size={16}
        className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition flex-shrink-0 mt-2"
      />
    </Link>
  );
}
