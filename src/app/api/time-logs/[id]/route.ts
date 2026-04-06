import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const body = await req.json();
  const { seconds, note } = body;

  try {
    const existingLog = await prisma.timeLog.findUnique({
      where: { id },
      select: { seconds: true, userId: true, ticketId: true }
    });

    if (!existingLog) {
      return NextResponse.json({ error: "Time log not found" }, { status: 404 });
    }

    // Authorization: Owner or Admin
    if (existingLog.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const diff = seconds !== undefined ? Math.round(seconds) - existingLog.seconds : 0;

    const [updatedLog] = await prisma.$transaction([
      prisma.timeLog.update({
        where: { id },
        data: {
          seconds: seconds !== undefined ? Math.round(seconds) : undefined,
          note: note !== undefined ? note : undefined
        },
        include: { user: { select: { id: true, name: true, image: true } } }
      }),
      prisma.ticket.update({
        where: { id: existingLog.ticketId },
        data: { totalTimeSpent: { increment: diff } }
      })
    ]);

    return NextResponse.json({ log: updatedLog });
  } catch (error) {
    console.error("PATCH time log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  try {
    const existingLog = await prisma.timeLog.findUnique({
      where: { id },
      select: { seconds: true, userId: true, ticketId: true }
    });

    if (!existingLog) {
      return NextResponse.json({ error: "Time log not found" }, { status: 404 });
    }

    // Authorization: Owner or Admin
    if (existingLog.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.timeLog.delete({
        where: { id }
      }),
      prisma.ticket.update({
        where: { id: existingLog.ticketId },
        data: { totalTimeSpent: { decrement: existingLog.seconds } }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE time log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
