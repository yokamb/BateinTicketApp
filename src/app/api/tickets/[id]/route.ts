import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailNotification } from "@/lib/email";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: { workspace: true }
    });

    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let hasAccess = false;
    if (user.role === "ADMIN") {
        hasAccess = ticket.workspace.adminId === user.id;
    } else {
        const access = await prisma.instanceAccess.findUnique({
            where: { workspaceId_userId: { workspaceId: ticket.workspaceId, userId: user.id } }
        });
        hasAccess = !!access;
    }
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { status, priority, description, title, approvalStatus } = body;

    const data: any = {};
    if (description !== undefined) data.description = description;
    if (title !== undefined && title.trim() !== "") data.title = title;
    if (priority) data.priority = priority;
    
    // Approval checking
    if (approvalStatus && user.id === ticket.approverId) {
        data.approvalStatus = approvalStatus;
        if (approvalStatus === "APPROVED") data.status = "OPEN";
        if (approvalStatus === "REJECTED") data.status = "CLOSED";
    }

    if (status) {
        // block resolving unapproved changes
        if (ticket.type === "CHANGE" && ticket.workspace.requiresChangeApproval && ticket.approvalStatus !== "APPROVED") {
            if (status === "RESOLVED" || status === "CLOSED") {
                return NextResponse.json({ error: "Change tickets must be approved before they can be resolved or closed." }, { status: 400 });
            }
        }
        data.status = status;
    }

    const updated = await prisma.ticket.update({
        where: { id },
        data,
        include: {
            creator: true,
            workspace: { include: { admin: true } }
        }
    });

    if (status && status !== ticket.status) {
        // Send email to customer if admin updated it, or to admin if customer updated it
        const recipient = user.id === updated.workspace.adminId 
            ? updated.creator.email 
            : updated.workspace.admin.email;

        if (recipient) {
            await sendEmailNotification(
                recipient,
                `Ticket Status Updated: ${updated.title}`,
                `The ticket status has been changed to ${status} by ${user.name || "a user"}.`
            );
        }
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: { workspace: true }
    });

    if (!ticket || ticket.workspace.adminId !== user.id) {
        return NextResponse.json({ error: "Forbidden or Not Found" }, { status: 403 });
    }

    await prisma.ticket.delete({
        where: { id }
    });

    return NextResponse.json({ success: true });
  } catch(e: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
