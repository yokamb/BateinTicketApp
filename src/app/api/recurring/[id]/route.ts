import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeNextRunAt } from "@/lib/utils/recurring";

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

  const creator = await prisma.user.findUnique({
    where: { id: user.id },
    select: { timezone: true }
  });

  const updateData = {
    ...body,
    nextRunAt: body.frequency || body.timeHour !== undefined || body.timeMinute !== undefined || body.dayOfWeek !== undefined || body.dayOfMonth !== undefined
      ? computeNextRunAt(
          body.frequency ?? template.frequency,
          body.timeHour ?? template.timeHour,
          body.timeMinute ?? template.timeMinute,
          body.dayOfWeek ?? template.dayOfWeek,
          body.dayOfMonth ?? template.dayOfMonth,
          creator?.timezone || "UTC"
        )
      : undefined
  };

  const updated = await prisma.recurringTemplate.update({
    where: { id },
    data: updateData,
    include: { workspace: { select: { id: true, name: true } } }
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
