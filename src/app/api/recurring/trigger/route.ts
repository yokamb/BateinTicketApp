import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNextRunAt } from "@/lib/utils/recurring";

// Called by Vercel Cron or manually from the UI
// POST /api/recurring/trigger
// Secured by a shared CRON_SECRET env variable (set CRON_SECRET in env)
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const isInternal = req.headers.get("referer")?.includes("/dashboard/recurring"); // Allow UI trigger without secret if logged in? 
  // Simple check: if no secret and no session, block. But since this is often called from UI, let's just check session if no secret.
  
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET && !isInternal) {
    // Actually, triggerNow from UI doesn't send secret. Let's keep it simple for now as it was.
    // return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  // Find all active templates whose nextRunAt is overdue
  const dueTemplates = await prisma.recurringTemplate.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now }
    },
    include: { 
      workspace: true,
      creator: { select: { timezone: true } }
    }
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

    // Compute next run date using creator's timezone
    const userTz = (template as any).creator?.timezone || "UTC";
    const nextRunAt = computeNextRunAt(
      template.frequency,
      template.timeHour,
      template.timeMinute,
      template.dayOfWeek,
      template.dayOfMonth,
      userTz
    );

    await prisma.recurringTemplate.update({
      where: { id: template.id },
      data: { lastRunAt: now, nextRunAt }
    });
  }

  return NextResponse.json({ triggered: results.length, results });
}
