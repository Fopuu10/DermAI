import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, isPremium } from "@/lib/auth";
import PremiumGate from "@/components/PremiumGate";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) notFound();

  const user = await getCurrentUser();
  const premium = isPremium(user?.subscription);
  if (article.isPremium && !premium) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Link href="/library" className="text-xs text-slate-500">← Back</Link>
        <h1 className="text-2xl font-bold text-slate-800 my-3">{article.title}</h1>
        <p className="text-slate-500 mb-4">{article.excerpt}</p>
        <PremiumGate feature="Premium articles" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link href="/library" className="text-xs text-slate-500">← Back to library</Link>
      <h1 className="text-3xl font-bold text-slate-800 mt-3">{article.title}</h1>
      <div className="prose prose-slate mt-6 text-slate-700 leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
      </div>
    </div>
  );
}
