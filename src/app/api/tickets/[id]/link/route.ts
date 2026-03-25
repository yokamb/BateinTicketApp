import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetTicketId } = await req.json();

    if (!targetTicketId) return NextResponse.json({ error: "Target Ticket ID required" }, { status: 400 });
    if (targetTicketId === id) return NextResponse.json({ error: "Cannot link a ticket to itself" }, { status: 400 });

    const source = await prisma.ticket.findUnique({ where: { id }});
    const target = await prisma.ticket.findUnique({ where: { id: targetTicketId }});

    if (!source || !target) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    // Prevent cross-workspace linking for simplicity and security
    if (source.workspaceId !== target.workspaceId) {
        return NextResponse.json({ error: "Tickets must be in the same workspace" }, { status: 400 });
    }

    const link = await prisma.ticketLink.create({
      data: {
        sourceId: source.id,
        targetId: target.id
      }
    });

    return NextResponse.json(link, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: "Tickets are already linked" }, { status: 400 });
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
