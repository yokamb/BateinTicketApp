import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ticket = await (prisma as any).ticket.findUnique({
      where: { id: ticketId },
      include: { workspace: true }
    });

    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    // Check if user is the admin or creator
    const isOwner = ticket.workspace.adminId === user.id || ticket.creatorId === user.id;

    if (!isOwner) {
        return NextResponse.json({ error: "Forbidden: Only the ticket owner can resubmit." }, { status: 403 });
    }

    const updatedTicket = await (prisma as any).ticket.update({
      where: { id: ticketId },
      data: {
        approvalStatus: "PENDING",
        rejectionFeedback: null,
      }
    });

    // Add a comment for the resubmission
    await (prisma as any).comment.create({
      data: {
        text: `Ticket resubmitted for approval after addressing feedback.`,
        ticketId: ticketId,
        userId: user.id
      }
    });

    return NextResponse.json(updatedTicket);
  } catch (e: any) {
    console.error("Resubmission failed", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
