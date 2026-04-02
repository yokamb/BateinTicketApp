import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userSession = session.user as any;
    const dbUser = await prisma.user.findUnique({ where: { id: userSession.id } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plan = dbUser.plan || "FREE";

    // 1. Snapshot Metrics (Available to everyone)
    // We aggregate for all workspaces owned by the user
    const stats = await prisma.ticket.aggregate({
      where: {
        workspace: { adminId: dbUser.id }
      },
      _count: {
        id: true,
      },
      _sum: {
        totalTimeSpent: true,
      }
    });

    const statusCounts = await prisma.ticket.groupBy({
      by: ['status'],
      where: {
        workspace: { adminId: dbUser.id }
      },
      _count: {
        id: true
      }
    });

    const priorityCounts = await prisma.ticket.groupBy({
      by: ['priority'],
      where: {
        workspace: { adminId: dbUser.id }
      },
      _count: {
        id: true
      }
    });

    // 2. Trend Metrics (Limited for FREE, 30 days for PRO/MAX)
    let trendData: any[] = [];
    if (plan !== "FREE") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const rawTrends = await prisma.ticket.groupBy({
        by: ['createdAt'],
        where: {
          workspace: { adminId: dbUser.id },
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: { id: true }
      });

      // Format for simple chart consumption (group by date string)
      const dayMap: Record<string, number> = {};
      rawTrends.forEach((t: any) => {
        const d = t.createdAt.toISOString().split('T')[0];
        dayMap[d] = (dayMap[d] || 0) + t._count.id;
      });
      trendData = Object.entries(dayMap).map(([date, count]) => ({ date, count }));
    }

    // 3. Resolution Stats (MAX only)
    let avgResolutionSeconds = 0;
    if (plan === "MAX") {
      const resolvedTickets = await prisma.ticket.findMany({
        where: {
          workspace: { adminId: dbUser.id },
          status: { in: ["RESOLVED", "CLOSED"] }
        },
        select: { createdAt: true, updatedAt: true }
      });

      if (resolvedTickets.length > 0) {
        const total = resolvedTickets.reduce((acc: number, t: any) => {
          return acc + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / 1000;
        }, 0);
        avgResolutionSeconds = total / resolvedTickets.length;
      }
    }

    return NextResponse.json({
      plan,
      totalTickets: stats._count.id,
      totalTimeWorked: stats._sum.totalTimeSpent || 0,
      statusBreakdown: statusCounts.map((c: any) => ({ status: c.status, count: c._count.id })),
      priorityBreakdown: priorityCounts.map((c: any) => ({ priority: c.priority, count: c._count.id })),
      trends: trendData,
      performance: {
        avgResolutionSeconds
      }
    });

  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
