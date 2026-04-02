import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const user = session.user as any;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/onboarding");

  // Fetch initial stats
  const stats = await prisma.ticket.aggregate({
    where: { workspace: { adminId: dbUser.id } },
    _count: { id: true },
    _sum: { totalTimeSpent: true }
  });

  const statusCounts = await prisma.ticket.groupBy({
    by: ['status'],
    where: { workspace: { adminId: dbUser.id } },
    _count: { id: true }
  });

  const priorityCounts = await prisma.ticket.groupBy({
    by: ['priority'],
    where: { workspace: { adminId: dbUser.id } },
    _count: { id: true }
  });

  // Basic trend for Pro/Max (last 7 days by default for initial load)
  let initialTrends: any[] = [];
  if (dbUser.plan !== "FREE") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const rawTrends = await prisma.ticket.findMany({
      where: { workspace: { adminId: dbUser.id }, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });
    const map: Record<string, number> = {};
    rawTrends.forEach((t: any) => {
      const d = t.createdAt.toLocaleDateString(undefined, { weekday: 'short' });
      map[d] = (map[d] || 0) + 1;
    });
    initialTrends = Object.entries(map).map(([label, value]) => ({ label, value }));
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#111] tracking-tighter mb-2">Workspace Flux</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Real-time analytical transmission</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border-2 border-slate-50 shadow-sm">
          <div className={`w-3 h-3 rounded-full animate-pulse ${dbUser.plan === "FREE" ? "bg-slate-300" : "bg-indigo-500"}`}></div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-800">{dbUser.plan || "FREE"} SUBSCRIBER</span>
        </div>
      </div>

      <AnalyticsClient
        plan={dbUser.plan || "FREE"}
        stats={{
          totalTickets: stats._count.id,
          totalTimeWorked: stats._sum.totalTimeSpent || 0,
          statusBreakdown: statusCounts.map((c: any) => ({ status: c.status, count: c._count.id })),
          priorityBreakdown: priorityCounts.map((c: any) => ({ priority: c.priority, count: c._count.id })),
          trends: initialTrends
        }}
      />
    </div>
  );
}
