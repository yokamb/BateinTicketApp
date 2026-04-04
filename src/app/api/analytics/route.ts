import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userSession = session.user as any;
    const dbUser = await prisma.user.findUnique({ where: { id: userSession.id } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const filterStatus = searchParams.get("status") || undefined;
    const filterPriority = searchParams.get("priority") || undefined;
    const filterType = searchParams.get("type") || undefined;
    const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
    const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;
    const groupBy = searchParams.get("groupBy") || "status"; // status | priority | type | day

    // Build workspace filter
    const workspaceFilter = workspaceId
      ? { workspaceId }
      : { workspace: { adminId: dbUser.id } };

    const ticketFilter: any = {
      ...workspaceFilter,
      ...(filterStatus && { status: filterStatus }),
      ...(filterPriority && { priority: filterPriority }),
      ...(filterType && { type: filterType }),
      ...(dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo })
        }
      }
    };

    // Core aggregate stats
    const stats = await prisma.ticket.aggregate({
      where: ticketFilter,
      _count: { id: true },
      _sum: { totalTimeSpent: true }
    });

    // Status breakdown
    const statusCounts = await prisma.ticket.groupBy({
      by: ["status"],
      where: ticketFilter,
      _count: { id: true }
    });

    // Priority breakdown
    const priorityCounts = await prisma.ticket.groupBy({
      by: ["priority"],
      where: ticketFilter,
      _count: { id: true }
    });

    // Type breakdown
    const typeCounts = await prisma.ticket.groupBy({
      by: ["type"],
      where: ticketFilter,
      _count: { id: true }
    });

    // TypeCategory breakdown
    const categoryBreakdown = await prisma.ticket.groupBy({
      by: ["typeCategory"],
      where: ticketFilter,
      _count: { id: true }
    });

    // Trend over time (last 30 days by default or filtered range)
    const trendStart = dateFrom || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
    const rawTrends = await prisma.ticket.findMany({
      where: { ...ticketFilter, createdAt: { gte: trendStart, ...(dateTo && { lte: dateTo }) } },
      select: { createdAt: true }
    });

    const dayMap: Record<string, number> = {};
    rawTrends.forEach((t: any) => {
      const d = t.createdAt.toISOString().split("T")[0];
      dayMap[d] = (dayMap[d] || 0) + 1;
    });
    const trendData = Object.entries(dayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Resolution time stats 
    const resolvedTickets = await prisma.ticket.findMany({
      where: { ...ticketFilter, status: { in: ["RESOLVED", "CLOSED"] } },
      select: { createdAt: true, updatedAt: true, totalTimeSpent: true }
    });

    let avgResolutionSeconds = 0;
    let avgTimeSpent = 0;
    if (resolvedTickets.length > 0) {
      const totalResolution = resolvedTickets.reduce((acc: number, t: any) => {
        return acc + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / 1000;
      }, 0);
      avgResolutionSeconds = totalResolution / resolvedTickets.length;

      const totalTimeSpent = resolvedTickets.reduce((acc: number, t: any) => acc + (t.totalTimeSpent || 0), 0);
      avgTimeSpent = totalTimeSpent / resolvedTickets.length;
    }

    // Time logs per day (for area chart)
    const timeLogs = await prisma.timeLog.findMany({
      where: {
        ticket: ticketFilter,
        createdAt: { gte: trendStart }
      },
      select: { seconds: true, createdAt: true }
    });

    const timePerDay: Record<string, number> = {};
    timeLogs.forEach((tl: any) => {
      const d = tl.createdAt.toISOString().split("T")[0];
      timePerDay[d] = (timePerDay[d] || 0) + tl.seconds;
    });
    const timeLogTrend = Object.entries(timePerDay)
      .map(([date, seconds]) => ({ date, minutes: Math.round(seconds / 60) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Recurring ticket count
    const recurringTicketCount = await prisma.ticket.count({
      where: { ...ticketFilter, recurringTemplateId: { not: null } }
    });

    // All workspaces for filter dropdown
    const userWorkspaces = await prisma.workspace.findMany({
      where: { adminId: dbUser.id },
      select: { id: true, name: true }
    });

    return NextResponse.json({
      plan: dbUser.plan,
      totalTickets: stats._count.id,
      totalTimeWorked: stats._sum.totalTimeSpent || 0,
      recurringTicketCount,
      statusBreakdown: statusCounts.map((c: any) => ({ status: c.status, count: c._count.id })),
      priorityBreakdown: priorityCounts.map((c: any) => ({ priority: c.priority, count: c._count.id })),
      typeBreakdown: typeCounts.map((c: any) => ({ type: c.type, count: c._count.id })),
      categoryBreakdown: categoryBreakdown.map((c: any) => ({ category: c.typeCategory, count: c._count.id })),
      trends: trendData,
      timeLogTrend,
      performance: { avgResolutionSeconds, avgTimeSpent },
      workspaces: userWorkspaces
    });

  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
