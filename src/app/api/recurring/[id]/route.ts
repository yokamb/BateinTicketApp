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
    const targetDay = dayOfWeek ?? 1;
    let daysUntil = (targetDay - now.getDay() + 7) % 7;
    if (daysUntil === 0 && next <= now) daysUntil = 7;
    next.setDate(now.getDate() + daysUntil);
    if (frequency === "BIWEEKLY" && next <= now) next.setDate(next.getDate() + 14);
    return next;
  }
  if (frequency === "MONTHLY") {
    const targetDay = dayOfMonth ?? 1;
    next.setDate(targetDay);
    if (next <= now) { next.setMonth(next.getMonth() + 1); next.setDate(targetDay); }
    return next;
  }
  return next;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const template = await prisma.recurringTemplate.findFirst({
    where: { id, workspace: { adminId: user.id } }
  });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const updated = await prisma.recurringTemplate.update({
    where: { id },
    data: {
      ...body,
      nextRunAt: body.frequency
        ? computeNextRunAt(
            body.frequency ?? template.frequency,
            body.timeHour ?? template.timeHour,
            body.timeMinute ?? template.timeMinute,
            body.dayOfWeek ?? template.dayOfWeek,
            body.dayOfMonth ?? template.dayOfMonth
          )
        : undefined
    }
  });

  return NextResponse.json({ template: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const template = await prisma.recurringTemplate.findFirst({
    where: { id, workspace: { adminId: user.id } }
  });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recurringTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
