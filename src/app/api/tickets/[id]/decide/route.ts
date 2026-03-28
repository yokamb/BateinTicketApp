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

    const { decision, feedback } = await req.json(); // APPROVED or REJECTED

    const ticket = await (prisma as any).ticket.findUnique({
      where: { id: ticketId },
      include: { workspace: true }
    });

    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    // Check if user is a GUEST in this workspace
    const access = await (prisma as any).instanceAccess.findUnique({
        where: { workspaceId_userId: { workspaceId: ticket.workspaceId, userId: user.id } }
    });

    if (!access || access.role !== "GUEST") {
        return NextResponse.json({ error: "Only guests can make approval decisions." }, { status: 403 });
    }

    const updatedTicket = await (prisma as any).ticket.update({
      where: { id: ticketId },
      data: {
        approvalStatus: decision,
        rejectionFeedback: decision === "REJECTED" ? feedback : null,
      }
    });

    // Add a comment for the decision
    await (prisma as any).comment.create({
      data: {
        text: `Decision made: ${decision}${decision === "REJECTED" ? `\n\nFeedback: ${feedback}` : ""}`,
        ticketId: ticketId,
        userId: user.id
      }
    });

    return NextResponse.json(updatedTicket);
  } catch (e: any) {
    console.error("Decision failed", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
