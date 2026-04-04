import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const workspaceId = searchParams.get("workspaceId") || "";

  // Date range filter
  const dateFrom = from ? new Date(from) : (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // default: last 7 days
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const dateTo = to ? new Date(to + "T23:59:59.999Z") : new Date();

  // Get workspaces the user has access to
  const ownedWorkspaces = await prisma.workspace.findMany({ where: { adminId: user.id }, select: { id: true } });
  const joinedWorkspaces = await (prisma as any).instanceAccess.findMany({
    where: { userId: user.id },
    select: { workspaceId: true }
  });
  const accessibleWorkspaceIds = [
    ...ownedWorkspaces.map((w: any) => w.id),
    ...joinedWorkspaces.map((j: any) => j.workspaceId)
  ];

  const workspaceFilter = workspaceId && accessibleWorkspaceIds.includes(workspaceId)
    ? [workspaceId]
    : accessibleWorkspaceIds;

  // Fetch all time logs in range for tickets in accessible workspaces
  const logs = await prisma.timeLog.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      userId: user.id, // Show only YOUR own logs
      ticket: {
        workspaceId: { in: workspaceFilter }
      }
    },
    include: {
      ticket: {
        select: {
          id: true,
          shortId: true,
          title: true,
          type: true,
          typeCategory: true,
          status: true,
          workspace: { select: { id: true, name: true } }
        }
      },
      user: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  // Build per-ticket summary
  const ticketMap: Record<string, {
    ticket: any;
    totalSeconds: number;
    entries: any[];
  }> = {};

  for (const log of logs) {
    const tid = log.ticketId;
    if (!ticketMap[tid]) {
      ticketMap[tid] = { ticket: log.ticket, totalSeconds: 0, entries: [] };
    }
    ticketMap[tid].totalSeconds += log.seconds;
    ticketMap[tid].entries.push({
      id: log.id,
      seconds: log.seconds,
      note: log.note,
      isManual: log.isManual,
      createdAt: log.createdAt
    });
  }

  const ticketSummaries = Object.values(ticketMap).sort((a, b) => b.totalSeconds - a.totalSeconds);

  // Build daily breakdown (for chart)
  const dailyMap: Record<string, number> = {};
  for (const log of logs) {
    const day = log.createdAt.toISOString().split("T")[0];
    dailyMap[day] = (dailyMap[day] || 0) + log.seconds;
  }

  // Build weekly breakdown
  const weeklyMap: Record<string, number> = {};
  for (const log of logs) {
    const d = new Date(log.createdAt);
    const dayOfWeek = d.getDay();
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekKey = startOfWeek.toISOString().split("T")[0];
    weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + log.seconds;
  }

  const totalSeconds = logs.reduce((acc: number, l: { seconds: number }) => acc + l.seconds, 0);


  return NextResponse.json({
    totalSeconds,
    logCount: logs.length,
    ticketCount: ticketSummaries.length,
    ticketSummaries,
    dailyBreakdown: Object.entries(dailyMap)
      .map(([date, seconds]) => ({ date, seconds }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    weeklyBreakdown: Object.entries(weeklyMap)
      .map(([weekStart, seconds]) => ({ weekStart, seconds }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
  });
}
