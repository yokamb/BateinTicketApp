import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by Vercel Cron or manually from the UI
// POST /api/recurring/trigger
// Secured by a shared CRON_SECRET env variable (set CRON_SECRET in env)
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  // Find all active templates whose nextRunAt is overdue
  const dueTemplates = await prisma.recurringTemplate.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now }
    },
    include: { workspace: true }
  });

  const results: { templateId: string; ticketId: string }[] = [];

  for (const template of dueTemplates) {
    // Generate a short ID for the spawned ticket
    const shortId = `${template.type.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;

    const ticket = await prisma.ticket.create({
      data: {
        shortId,
        title: template.title,
        description: template.description,
        type: template.type,
        typeCategory: template.typeCategory,
        priority: template.priority,
        status: "OPEN",
        workspaceId: template.workspaceId,
        creatorId: template.creatorId,
        recurringTemplateId: template.id
      }
    });

    results.push({ templateId: template.id, ticketId: ticket.id });

    // Compute next run date
    const nextRunAt = computeNextRunAt(
      template.frequency,
      template.timeHour,
      template.timeMinute,
      template.dayOfWeek,
      template.dayOfMonth
    );

    await prisma.recurringTemplate.update({
      where: { id: template.id },
      data: { lastRunAt: now, nextRunAt }
    });
  }

  return NextResponse.json({ triggered: results.length, results });
}

function computeNextRunAt(
  frequency: string,
  timeHour: number,
  timeMinute: number,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date {
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setHours(timeHour, timeMinute);

  if (frequency === "DAILY") {
    next.setDate(now.getDate() + 1);
    return next;
  }
  if (frequency === "WEEKLY") {
    next.setDate(now.getDate() + 7);
    return next;
  }
  if (frequency === "BIWEEKLY") {
    next.setDate(now.getDate() + 14);
    return next;
  }
  if (frequency === "MONTHLY") {
    next.setMonth(now.getMonth() + 1);
    if (dayOfMonth) next.setDate(dayOfMonth);
    return next;
  }
  return next;
}
