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

  const workspaces = await prisma.workspace.findMany({
    where: { adminId: dbUser.id },
    select: { id: true, name: true }
  });

  const ticketFilter = { workspace: { adminId: dbUser.id } };
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [stats, statusCounts, priorityCounts, typeCounts, categoryCounts, resolvedTickets, recurringCount, timeLogs, rawTrends] =
    await Promise.all([
      prisma.ticket.aggregate({ where: ticketFilter, _count: { id: true }, _sum: { totalTimeSpent: true } }),
      prisma.ticket.groupBy({ by: ["status"], where: ticketFilter, _count: { id: true } }),
      prisma.ticket.groupBy({ by: ["priority"], where: ticketFilter, _count: { id: true } }),
      prisma.ticket.groupBy({ by: ["type"], where: ticketFilter, _count: { id: true } }),
      prisma.ticket.groupBy({ by: ["typeCategory"], where: ticketFilter, _count: { id: true } }),
      prisma.ticket.findMany({
        where: { ...ticketFilter, status: { in: ["RESOLVED", "CLOSED"] } },
        select: { createdAt: true, updatedAt: true, totalTimeSpent: true }
      }),
      prisma.ticket.count({ where: { ...ticketFilter, recurringTemplateId: { not: null } } }),
      prisma.timeLog.findMany({
        where: { ticket: ticketFilter, createdAt: { gte: thirtyDaysAgo } },
        select: { seconds: true, createdAt: true }
      }),
      prisma.ticket.findMany({
        where: { ...ticketFilter, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
      })
    ]);

  // Process trend data
  const dayMap: Record<string, number> = {};
  rawTrends.forEach((t: any) => {
    const d = t.createdAt.toISOString().split("T")[0];
    dayMap[d] = (dayMap[d] || 0) + 1;
  });
  const trends = Object.entries(dayMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

  // Process time log trend
  const timePerDay: Record<string, number> = {};
  timeLogs.forEach((tl: any) => {
    const d = tl.createdAt.toISOString().split("T")[0];
    timePerDay[d] = (timePerDay[d] || 0) + tl.seconds;
  });
  const timeLogTrend = Object.entries(timePerDay).map(([date, seconds]) => ({ date, minutes: Math.round(seconds / 60) })).sort((a, b) => a.date.localeCompare(b.date));

  // Avg resolution
  let avgResolutionSeconds = 0;
  let avgTimeSpent = 0;
  if (resolvedTickets.length > 0) {
    const totalResolution = resolvedTickets.reduce((acc: number, t: any) =>
      acc + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / 1000, 0);
    avgResolutionSeconds = totalResolution / resolvedTickets.length;
    const totalTimeSpent = resolvedTickets.reduce((acc: number, t: any) => acc + (t.totalTimeSpent || 0), 0);
    avgTimeSpent = totalTimeSpent / resolvedTickets.length;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <AnalyticsClient
        initialStats={{
          plan: dbUser.plan || "FREE",
          totalTickets: stats._count.id,
          totalTimeWorked: stats._sum.totalTimeSpent || 0,
          recurringTicketCount: recurringCount,
          statusBreakdown: statusCounts.map((c: any) => ({ status: c.status, count: c._count.id })),
          priorityBreakdown: priorityCounts.map((c: any) => ({ priority: c.priority, count: c._count.id })),
          typeBreakdown: typeCounts.map((c: any) => ({ type: c.type, count: c._count.id })),
          categoryBreakdown: categoryCounts.map((c: any) => ({ category: c.typeCategory, count: c._count.id })),
          trends,
          timeLogTrend,
          performance: { avgResolutionSeconds, avgTimeSpent },
          workspaces
        }}
      />
    </div>
  );
}
