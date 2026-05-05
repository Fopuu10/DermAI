import Link from "next/link";
import { prisma } from "@/lib/db";
import { safeJSON, timeAgo } from "@/lib/utils";
import {
  MessageSquare,
  ArrowUp,
  Plus,
  Users,
  TrendingUp,
  Hash,
  Eye,
  Pin,
  Sparkles,
} from "lucide-react";

const TAGS = ["All", "Acne", "Eczema", "Dandruff", "Oily Skin", "Dry Skin", "Rosacea", "Psoriasis", "General"];

const AVATAR_TINTS = [
  "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-600",
  "bg-sky-100 text-sky-600",
  "bg-purple-100 text-purple-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
];

function tintFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 100000;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

const SKIN_GROUPS = [
  {
    name: "Oily Skin & Acne",
    description: "Battling shine and breakouts",
    gradient: "from-rose-400 to-pink-500",
    members: "2.4k",
    icon: "💧",
    href: "/community?tag=acne",
  },
  {
    name: "Dry & Sensitive",
    description: "Hydration-focused circle",
    gradient: "from-sky-400 to-blue-600",
    members: "1.8k",
    icon: "❄️",
    href: "/community?tag=eczema",
  },
  {
    name: "Pigmentation Journey",
    description: "Fade-tracking together",
    gradient: "from-amber-400 to-orange-500",
    members: "1.2k",
    icon: "✨",
    href: "/community?tag=pigmentation",
  },
];

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const where =
    tag && tag !== "All"
      ? { status: "active", tags: { contains: tag.toLowerCase() } }
      : { status: "active" };
  const posts = await prisma.communityPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { fullName: true, email: true } }, _count: { select: { comments: true } } },
  });

  const [totalPosts, totalUsers, weekPosts] = await Promise.all([
    prisma.communityPost.count({ where: { status: "active" } }),
    prisma.user.count(),
    prisma.communityPost.count({
      where: { status: "active", createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
    }),
  ]);

  // Pick the highest-upvoted post as "pinned"
  const pinned = !tag || tag === "All"
    ? await prisma.communityPost.findFirst({
        where: { status: "active" },
        orderBy: { upvotes: "desc" },
        include: { user: { select: { fullName: true, email: true } }, _count: { select: { comments: true } } },
      })
    : null;

  const restPosts = pinned ? posts.filter((p) => p.id !== pinned.id) : posts;

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="md:hidden">
          <h1 className="text-xl font-bold text-slate-800">Community</h1>
          <p className="text-sm text-slate-500">Share & learn from others</p>
        </div>
        <p className="hidden md:block text-sm text-slate-500">Share & learn from others</p>
        <Link href="/community/new" className="btn-primary">
          <Plus size={16} /> New post
        </Link>
      </div>

      {/* Hero stats strip */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-emerald-700 text-white p-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute right-32 -bottom-12 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative grid grid-cols-3 gap-4">
          <Hero label="Members" value={`${(totalUsers + 5400).toLocaleString("en-IN")}`} icon={Users} />
          <Hero label="Posts" value={totalPosts.toString()} icon={MessageSquare} />
          <Hero label="This week" value={`+${weekPosts}`} icon={TrendingUp} hot />
        </div>
      </div>

      {/* Skin groups */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={16} className="text-brand-600" /> Skin circles
          </h2>
          <span className="text-xs text-slate-400">Curated communities</span>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {SKIN_GROUPS.map((g) => (
            <Link
              key={g.name}
              href={g.href}
              className={`rounded-2xl p-5 text-white relative overflow-hidden bg-gradient-to-br ${g.gradient} hover:shadow-lg transition group`}
            >
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/15" />
              <div className="absolute right-12 -bottom-4 w-16 h-16 rounded-full bg-white/10" />
              <div className="relative">
                <div className="text-3xl">{g.icon}</div>
                <div className="font-bold mt-2">{g.name}</div>
                <div className="text-xs text-white/80 mt-0.5">{g.description}</div>
                <div className="text-[11px] mt-3 inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
                  <Users size={10} /> {g.members} members
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tag filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
        {TAGS.map((t) => {
          const active = (!tag && t === "All") || tag?.toLowerCase() === t.toLowerCase();
          return (
            <Link
              key={t}
              href={t === "All" ? "/community" : `/community?tag=${t.toLowerCase()}`}
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

      {posts.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 grid place-items-center mb-3">
            <MessageSquare size={28} className="text-slate-400" />
          </div>
          <div className="font-semibold text-slate-700">No posts yet</div>
          <div className="text-sm text-slate-400 mt-1">Be the first to share</div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pinned/Top post */}
          {pinned && (
            <PostCard post={pinned} pinned />
          )}
          {restPosts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function Hero({
  label,
  value,
  icon: Icon,
  hot = false,
}: {
  label: string;
  value: string;
  icon: any;
  hot?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-white/80 text-xs uppercase tracking-wide font-semibold">
        <Icon size={12} /> {label}
      </div>
      <div className="text-3xl md:text-4xl font-bold mt-1 flex items-center gap-2">
        {value} {hot && <span>🔥</span>}
      </div>
    </div>
  );
}

function PostCard({ post, pinned = false }: { post: any; pinned?: boolean }) {
  const tags = safeJSON<string[]>(post.tags, []);
  const authorLabel = post.isAnonymous ? "Anonymous" : post.user.fullName ?? "User";
  const authorInitial = (post.isAnonymous ? "?" : post.user.fullName ?? "U")[0].toUpperCase();
  const authorTint = post.isAnonymous ? "bg-slate-200 text-slate-500" : tintFor(post.user.email);

  return (
    <Link
      href={`/community/${post.id}`}
      className={`card p-5 block hover:shadow-md transition ${
        pinned ? "ring-2 ring-amber-200 bg-gradient-to-br from-amber-50/40 to-white" : ""
      }`}
    >
      {pinned && (
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-700 mb-2">
          <Pin size={10} /> Top discussion
        </div>
      )}
      <div className="flex items-start gap-3">
        {/* Author avatar */}
        <div
          className={`w-10 h-10 rounded-full grid place-items-center font-bold ${authorTint} flex-shrink-0`}
        >
          {authorInitial}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-600">{authorLabel}</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
          <h3 className="font-bold text-slate-800 leading-snug">{post.title}</h3>
          <p className="text-sm text-slate-500 line-clamp-2 mt-1">{post.body}</p>
          <div className="flex items-center gap-3 mt-3">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1">
              <ArrowUp size={12} className="text-brand-600" /> {post.upvotes}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={12} /> {post._count.comments}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye size={12} /> {post.views}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
