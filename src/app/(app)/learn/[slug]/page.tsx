import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isPremium } from "@/lib/auth";
import PremiumGate from "@/components/PremiumGate";
import BackButton from "@/components/BackButton";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) notFound();

  const user = await getCurrentUser();
  const premium = isPremium(user?.subscription);
  if (article.isPremium && !premium) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto space-y-4">
        <BackButton href="/learn" label="Back to learn" />
        <h1 className="text-2xl font-bold text-slate-800">{article.title}</h1>
        <p className="text-slate-500">{article.excerpt}</p>
        <PremiumGate feature="Premium articles" />
      </div>
    );
  }

  const readMins = Math.max(2, Math.round(article.contentHtml.replace(/<[^>]+>/g, "").split(/\s+/).length / 200));

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto space-y-4">
      <BackButton href="/learn" label="Back to learn" />
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{article.title}</h1>
        <div className="text-xs text-slate-400 mt-2 flex items-center gap-3">
          <span>By DermAI Editorial</span>
          <span>·</span>
          <span>{readMins} min read</span>
          <span>·</span>
          <span>{new Date(article.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
        </div>
      </div>
      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-slate-800 [&>h2]:mt-6 [&>h2]:mb-3 [&>p]:my-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-3 [&>ul>li]:my-1">
        <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
      </div>
    </div>
  );
}
