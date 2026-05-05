import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const user = (await getCurrentUser())!;
  if (user.role !== "admin") redirect("/dashboard");

  const [users, scans, posts, activeSubs, conditionCounts] = await Promise.all([
    prisma.user.count(),
    prisma.diagnosisRecord.count(),
    prisma.communityPost.count(),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.diagnosisRecord.groupBy({
      by: ["predictedCondition"],
      _count: { _all: true },
      orderBy: { _count: { predictedCondition: "desc" } },
      take: 10,
    }),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { subscription: true },
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-3">
        <Stat label="Users" value={users} />
        <Stat label="Active subs" value={activeSubs} />
        <Stat label="Total scans" value={scans} />
        <Stat label="Community posts" value={posts} />
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Top conditions</h2>
        <div className="space-y-1">
          {conditionCounts.map((c) => (
            <div key={c.predictedCondition} className="flex justify-between text-sm">
              <span>{c.predictedCondition}</span>
              <span className="text-slate-500">{c._count._all}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Recent users</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-400">
            <tr><th className="text-left py-1">Email</th><th className="text-left">Name</th><th className="text-left">Plan</th><th className="text-left">Joined</th></tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="py-2">{u.email}</td>
                <td>{u.fullName ?? "—"}</td>
                <td>{u.subscription?.status === "active" ? u.subscription.planId : "free"}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="text-3xl font-bold text-slate-800 mt-1">{value}</div>
    </div>
  );
}
