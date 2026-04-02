import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, currentTotalSeconds } = await req.json();

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const now = new Date();
    let updateData: any = {};

    if (action === "START") {
      updateData = {
        timerStartedAt: now,
      };
    } else if (action === "STOP") {
      // Calculate elapsed since timerStartedAt if it exists
      let additionalSeconds = 0;
      if (ticket.timerStartedAt) {
        additionalSeconds = Math.floor((now.getTime() - new Date(ticket.timerStartedAt).getTime()) / 1000);
      }
      
      updateData = {
        timerStartedAt: null,
        totalTimeSpent: {
            increment: Math.max(0, additionalSeconds)
        }
      };
    } else if (action === "SYNC") {
       // Regular sync while running to avoid data loss
       updateData = {
          totalTimeSpent: currentTotalSeconds,
          timerStartedAt: now // Reset start point to avoid double counting next time
       };
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
       totalTimeSpent: updatedTicket.totalTimeSpent, 
       timerStartedAt: updatedTicket.timerStartedAt 
    });

  } catch (error: any) {
    console.error("Timer Sync Error:", error);
    return NextResponse.json({ error: "Failed to sync timer" }, { status: 500 });
  }
}
