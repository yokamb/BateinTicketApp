import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { text, ticketId } = await req.json();
    if (!text || !ticketId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { workspace: true }
    });

    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Security check: must be owner or invited customer
    const isOwner = ticket.workspace.adminId === user.id;
    const access = await prisma.instanceAccess.findUnique({
        where: { workspaceId_userId: { workspaceId: ticket.workspaceId, userId: user.id } }
    });
    
    const hasAccess = isOwner || !!access;
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const comment = await prisma.comment.create({
        data: {
            text,
            ticketId,
            userId: user.id
        }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
