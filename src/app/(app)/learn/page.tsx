import Link from "next/link";
import { prisma } from "@/lib/db";
import { safeJSON } from "@/lib/utils";
import {
  Lock,
  BookOpen,
  Sparkles,
  Sun,
  Pill,
  Activity,
  Beaker,
  Scissors,
  TrendingUp,
  Eye,
  Star,
} from "lucide-react";

const TAGS = ["All", "Acne", "Advanced", "Treatment", "Dandruff", "Scalp", "Hair Care", "Routine", "Beginner"];

// Map article tags → distinct visual identity (gradient + decorative icon)
const STYLES: { match: RegExp; gradient: string; icon: any }[] = [
  { match: /retinoid/i, gradient: "from-purple-500 to-fuchsia-600", icon: Sparkles },
  { match: /acne|advanced/i, gradient: "from-rose-500 to-pink-600", icon: Activity },
  { match: /dandruff|scalp|hair/i, gradient: "from-indigo-500 to-blue-600", icon: Scissors },
  { match: /sunscreen|sun|spf/i, gradient: "from-amber-400 to-orange-500", icon: Sun },
  { match: /niacinamide|active|ingredient/i, gradient: "from-teal-500 to-emerald-600", icon: Beaker },
  { match: /isotretinoin|treatment/i, gradient: "from-rose-400 to-red-500", icon: Pill },
  { match: /routine/i, gradient: "from-emerald-400 to-teal-600", icon: Sun },
  { match: /label|beginner|guide/i, gradient: "from-sky-500 to-cyan-600", icon: BookOpen },
];

function styleFor(slug: string, title: string) {
  const haystack = `${slug} ${title}`;
  for (const s of STYLES) if (s.match.test(haystack)) return s;
  return STYLES[STYLES.length - 1];
}

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const all = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });
  const articles = !tag || tag === "All"
    ? all
    : all.filter((a) => safeJSON<string[]>(a.tags, []).some((t) => t.toLowerCase() === tag.toLowerCase()));
  const featured = all[0];
  const rest = articles.filter((a) => a.id !== featured?.id);

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-5">
      <div className="md:hidden">
        <h1 className="text-xl font-bold text-slate-800">Learn</h1>
        <p className="text-sm text-slate-500">Expert skincare education</p>
      </div>
      <p className="hidden md:block text-sm text-slate-500">
        Expert skincare education · {all.length} articles
      </p>

      {/* Tag filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
        {TAGS.map((t) => {
          const active = (!tag && t === "All") || tag?.toLowerCase() === t.toLowerCase();
          return (
            <Link
              key={t}
              href={t === "All" ? "/learn" : `/learn?tag=${t}`}
              className={`px-4 py-1.5 rounded-full text-sm border whitespace-nowrap transition ${
                active
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t}
            </Link>
          );
        })}
      </div>

      {/* Featured (only if showing All) */}
      {(!tag || tag === "All") && featured && (
        <FeaturedCard article={featured} />
      )}

      {/* Article list */}
      <div className="grid md:grid-cols-2 gap-4">
        {rest.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({ article }: { article: any }) {
  const tags = safeJSON<string[]>(article.tags, []);
  const style = styleFor(article.slug, article.title);
  const Icon = style.icon;

  return (
    <Link
      href={`/learn/${article.slug}`}
      className="block rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition group"
    >
      <div className="grid md:grid-cols-2">
        <div className={`relative bg-gradient-to-br ${style.gradient} p-8 min-h-[220px] grid place-items-center`}>
          <DecorativePattern />
          <div className="relative w-20 h-20 rounded-2xl bg-white/20 backdrop-blur grid place-items-center">
            <Icon size={36} className="text-white" strokeWidth={1.5} />
          </div>
          <span className="absolute top-4 left-4 inline-flex items-center gap-1 bg-white/90 text-slate-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
            <Star size={10} fill="currentColor" className="text-amber-500" /> Featured
          </span>
        </div>
        <div className="p-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {tags.slice(0, 2).map((t) => (
              <span key={t} className="chip capitalize">
                {t}
              </span>
            ))}
            {article.isPremium && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                <Lock size={10} /> Premium
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 group-hover:text-brand-700 transition">
            {article.title}
          </h2>
          <p className="text-sm text-slate-500 mt-2">{article.excerpt}</p>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-4">
            <span>By DermAI Editorial</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Eye size={12} /> 1.2k reads
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({ article }: { article: any }) {
  const tags = safeJSON<string[]>(article.tags, []);
  const style = styleFor(article.slug, article.title);
  const Icon = style.icon;

  return (
    <Link
      href={`/learn/${article.slug}`}
      className="card overflow-hidden block hover:shadow-md transition group"
    >
      <div className={`relative bg-gradient-to-br ${style.gradient} h-32 grid place-items-center`}>
        <DecorativePattern small />
        <div className="relative w-14 h-14 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
          <Icon size={24} className="text-white" strokeWidth={1.5} />
        </div>
        {article.isPremium && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            <Lock size={9} /> Premium
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.slice(0, 2).map((t) => (
            <span key={t} className="chip capitalize">
              {t}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-brand-700 transition">
          {article.title}
        </h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{article.excerpt}</p>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-3">
          <span>By DermAI Editorial</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <TrendingUp size={10} /> Popular
          </span>
        </div>
      </div>
    </Link>
  );
}

function DecorativePattern({ small = false }: { small?: boolean }) {
  const sizes = small
    ? { d1: "w-32 h-32 -right-12 -top-12", d2: "w-20 h-20 left-4 -bottom-4" }
    : { d1: "w-56 h-56 -right-16 -top-16", d2: "w-32 h-32 -left-8 -bottom-8" };
  return (
    <>
      <div className={`absolute ${sizes.d1} rounded-full bg-white/15`} />
      <div className={`absolute ${sizes.d2} rounded-full bg-white/10`} />
    </>
  );
}
