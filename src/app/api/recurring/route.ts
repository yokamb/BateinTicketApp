import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeNextRunAt } from "@/lib/utils/recurring";

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

  // Verify ownership and get user timezone
  const creator = await prisma.user.findUnique({
    where: { id: user.id },
    select: { timezone: true }
  });

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, adminId: user.id }
  });
  if (!workspace) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const nextRunAt = computeNextRunAt(
    frequency, 
    timeHour ?? 9, 
    timeMinute ?? 0, 
    dayOfWeek, 
    dayOfMonth,
    creator?.timezone || "UTC"
  );

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
