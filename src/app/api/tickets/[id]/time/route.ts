import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.timeLog.findMany({
    where: { ticketId: id },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ logs });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const body = await req.json();
  const { seconds, note, isManual } = body;

  if (!seconds || seconds <= 0) {
    return NextResponse.json({ error: "Invalid seconds value" }, { status: 400 });
  }

  const [log] = await prisma.$transaction([
    prisma.timeLog.create({
      data: {
        ticketId: id,
        userId: user.id,
        seconds: Math.round(seconds),
        note: note || null,
        isManual: isManual ?? false
      }
    }),
    prisma.ticket.update({
      where: { id },
      data: { totalTimeSpent: { increment: Math.round(seconds) } }
    })
  ]);

  return NextResponse.json({ log }, { status: 201 });
}
