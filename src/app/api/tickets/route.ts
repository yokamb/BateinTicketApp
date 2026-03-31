import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailNotification } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, priority, type, category, workspaceId, approverId } = await req.json();

    // Verification check
    let hasAccess = false;
    const ws = await (prisma as any).workspace.findUnique({ 
        where: { id: workspaceId } 
    });
    
    if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    if (ws.adminId === user.id) {
        hasAccess = true;
    } else {
        const access = await (prisma as any).instanceAccess.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: user.id } }
        });
        hasAccess = !!access;
    }

    if (!hasAccess) return NextResponse.json({ error: "Forbidden access to workspace" }, { status: 403 });

    // --- Enforce Approver Presence ---
    const tType = type || "INCIDENT";
    const tCategory = category || (tType.toUpperCase() === "CHANGE" ? "CHANGE" : tType.toUpperCase() === "REQUEST" ? "REQUEST" : "ISSUE");

    if (tCategory === "CHANGE") {
        const guestCount = await (prisma as any).instanceAccess.count({
            where: { workspaceId: workspaceId, role: "GUEST" }
        });
        if (guestCount === 0) {
            return NextResponse.json({ 
                error: "This ticket type requires Client Approval, but no approvers (clients) have been added. Please invite an approver first." 
            }, { status: 400 });
        }
    }
    
    // Check plan limits
    const dbUser = await (prisma as any).user.findUnique({ where: { id: user.id } });
    const plan = dbUser?.plan || "FREE";
    if (plan === "FREE") {
        const userTicketCount = await (prisma as any).ticket.count({ where: { creatorId: user.id } });
        if (userTicketCount >= 50) {
            return NextResponse.json({ error: "Free plan allows up to 50 tickets. Please upgrade your workspace or subscription." }, { status: 403 });
        }
    }

    const prefix = tCategory === "CHANGE" ? "CHG" : tCategory === "REQUEST" ? "REQ" : "INC";
    const ticketCount = await (prisma as any).ticket.count();
    const seqNum = 1000 + ticketCount;
    const shortId = `${prefix}${String(seqNum).padStart(7, '0')}`;

    // Optional: check if workspace requires change approval
    let initialStatus = "OPEN";
    if (tCategory === "CHANGE") {
        initialStatus = "PENDING";
    }

    const ticket = await (prisma as any).ticket.create({
      data: {
        title,
        description: description || "",
        priority: priority || "MEDIUM",
        type: tType,
        typeCategory: tCategory,
        shortId,
        status: initialStatus,
        approverId: (tCategory === "CHANGE" && approverId) ? approverId : null,
        workspaceId,
        creatorId: user.id,
      },
      include: {
        workspace: { include: { admin: true } },
        creator: true
      }
    });

    // Send email to the Freelancer (Admin of the workspace)
    if (user.id !== ticket.workspace.adminId) {
       await sendEmailNotification(
           ticket.workspace.admin.email as string,
           `New Ticket Created: ${ticket.title}`,
           `Customer ${ticket.creator.name} created a new ticket.\n\nPriority: ${ticket.priority}\n\n${ticket.description}`
       );
    } else {
       // Send to all customers in the workspace? (Optional MVP, let's just assume one customer for now or none)
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
