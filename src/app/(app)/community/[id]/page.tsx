import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { safeJSON, timeAgo } from "@/lib/utils";
import { Eye, MessageSquare, Share2 } from "lucide-react";
import CommentForm from "./CommentForm";
import UpvoteButton from "./UpvoteButton";
import BackButton from "@/components/BackButton";

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

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.communityPost.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true, email: true } },
      comments: {
        where: { status: "active" },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { fullName: true, email: true } } },
      },
    },
  });
  if (!post) notFound();

  await prisma.communityPost.update({ where: { id }, data: { views: { increment: 1 } } });

  const tags = safeJSON<string[]>(post.tags, []);
  const authorLabel = post.isAnonymous ? "Anonymous" : (post.user.fullName ?? "User");
  const authorInitial = (post.isAnonymous ? "?" : (post.user.fullName ?? "U"))[0].toUpperCase();
  const authorTint = post.isAnonymous ? "bg-slate-200 text-slate-500" : tintFor(post.user.email);

  // Related posts (same first tag)
  const related = tags.length
    ? await prisma.communityPost.findMany({
        where: {
          status: "active",
          id: { not: post.id },
          tags: { contains: tags[0] },
        },
        orderBy: { upvotes: "desc" },
        take: 3,
        include: { user: { select: { fullName: true } }, _count: { select: { comments: true } } },
      })
    : [];

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <BackButton href="/community" label="Back to community" />

      <div className="grid md:grid-cols-3 gap-6 mt-4">
        {/* Main column */}
        <div className="md:col-span-2 space-y-4">
          <article className="card p-6 md:p-7">
            {/* Author row */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full grid place-items-center font-bold ${authorTint}`}
              >
                {authorInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm">{authorLabel}</div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>{timeAgo(post.createdAt)}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Eye size={11} /> {post.views} views
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((t) => (
                  <span key={t} className="chip capitalize">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Title + body */}
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
              {post.title}
            </h1>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mt-4 text-[15px]">
              {post.body}
            </p>

            {/* Action bar */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
              <UpvoteButton postId={post.id} initial={post.upvotes} />
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 text-sm text-slate-600">
                <MessageSquare size={14} /> {post.comments.length}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 text-sm text-slate-600 ml-auto">
                <Share2 size={14} /> Share
              </button>
            </div>
          </article>

          {/* Comments */}
          <section className="card p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-slate-400" />
              {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
            </h2>

            {post.comments.length > 0 && (
              <div className="space-y-4 mb-6">
                {post.comments.map((c) => {
                  const cLabel = c.isAnonymous ? "Anonymous" : (c.user.fullName ?? "User");
                  const cInit = (c.isAnonymous ? "?" : (c.user.fullName ?? "U"))[0].toUpperCase();
                  const cTint = c.isAnonymous ? "bg-slate-200 text-slate-500" : tintFor(c.user.email);
                  return (
                    <div key={c.id} className="flex gap-3">
                      <div
                        className={`w-9 h-9 rounded-full grid place-items-center font-bold text-sm flex-shrink-0 ${cTint}`}
                      >
                        {cInit}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-800">{cLabel}</span>
                            <span className="text-[11px] text-slate-400">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {c.body}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 ml-1 text-xs text-slate-400">
                          <button className="hover:text-brand-700 font-medium">
                            ▲ {c.upvotes}
                          </button>
                          <button className="hover:text-brand-700">Reply</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <CommentForm postId={post.id} />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {related.length > 0 && (
            <div className="card p-5">
              <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-3">
                Related discussions
              </div>
              <div className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/community/${r.id}`}
                    className="block group"
                  >
                    <div className="text-sm font-semibold text-slate-700 line-clamp-2 group-hover:text-brand-700">
                      {r.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ▲ {r.upvotes} · {r._count.comments} comments
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5 bg-gradient-to-br from-brand-50 to-emerald-50 border-brand-100">
            <div className="font-semibold text-slate-800 mb-1">Community guidelines</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Be supportive. Share experience, not prescriptions. Don't dox other users. Flag content that breaks the rules.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
