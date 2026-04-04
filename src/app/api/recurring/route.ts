import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function computeNextRunAt(
  frequency: string,
  timeHour: number,
  timeMinute: number,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date {
  const now = new Date();
  const next = new Date();
  next.setSeconds(0, 0);
  next.setHours(timeHour, timeMinute);

  if (frequency === "DAILY") {
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    const targetDay = dayOfWeek ?? 1; // Monday default
    let daysUntil = (targetDay - now.getDay() + 7) % 7;
    if (daysUntil === 0 && next <= now) daysUntil = 7;
    next.setDate(now.getDate() + daysUntil);
    if (frequency === "BIWEEKLY") {
      // If computed day is within this week and we've already passed, add 14 days
      if (next <= now) next.setDate(next.getDate() + 14);
    }
    return next;
  }

  if (frequency === "MONTHLY") {
    const targetDay = dayOfMonth ?? 1;
    next.setDate(targetDay);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(targetDay);
    }
    return next;
  }

  return next;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const templates = await prisma.recurringTemplate.findMany({
    where: {
      workspace: { adminId: user.id }
    },
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const body = await req.json();
  const {
    workspaceId, title, description, type, typeCategory, priority,
    frequency, dayOfWeek, dayOfMonth, timeHour, timeMinute
  } = body;

  if (!workspaceId || !title || !type || !frequency) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify ownership
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, adminId: user.id }
  });
  if (!workspace) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const nextRunAt = computeNextRunAt(frequency, timeHour ?? 9, timeMinute ?? 0, dayOfWeek, dayOfMonth);

  const template = await prisma.recurringTemplate.create({
    data: {
      workspaceId,
      creatorId: user.id,
      title,
      description: description || "",
      type,
      typeCategory: typeCategory || "ISSUE",
      priority: priority || "MEDIUM",
      frequency,
      dayOfWeek: dayOfWeek ?? null,
      dayOfMonth: dayOfMonth ?? null,
      timeHour: timeHour ?? 9,
      timeMinute: timeMinute ?? 0,
      nextRunAt
    },
    include: { workspace: { select: { id: true, name: true } } }
  });

  return NextResponse.json({ template }, { status: 201 });
}
