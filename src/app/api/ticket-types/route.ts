import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_TICKET_MAPPINGS } from "@/lib/constants/roles";

async function hasWorkspaceAccess(userId: string, workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { customers: true }
  });

  if (!workspace) return false;
  if (workspace.adminId === userId) return true;
  return workspace.customers.some((c: any) => c.userId === userId);
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });

    const userId = (session.user as any).id;
    if (!(await hasWorkspaceAccess(userId, workspaceId))) {
      return NextResponse.json({ error: "Forbidden access to workspace" }, { status: 403 });
    }

    // Fetch custom ticket types from DB
    const ticketTypes = await (prisma as any).ticketType.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(ticketTypes);
  } catch (e) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, label, category } = await req.json();
    if (!workspaceId || !label || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    if (!(await hasWorkspaceAccess(userId, workspaceId))) {
      return NextResponse.json({ error: "Forbidden access to workspace" }, { status: 403 });
    }

    const ticketType = await (prisma as any).ticketType.create({
      data: { workspaceId, label, category },
    });

    return NextResponse.json(ticketType);
  } catch (e) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, label, category } = await req.json();
    if (!id || (!label && !category)) {
      return NextResponse.json({ error: "ID and at least one field to update are required" }, { status: 400 });
    }

    const tt = await (prisma as any).ticketType.findUnique({ where: { id } });
    if (!tt) return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });

    const userId = (session.user as any).id;
    if (!(await hasWorkspaceAccess(userId, tt.workspaceId))) {
      return NextResponse.json({ error: "Forbidden access to workspace" }, { status: 403 });
    }

    const updated = await (prisma as any).ticketType.update({
      where: { id },
      data: { label, category },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
  
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

      const tt = await (prisma as any).ticketType.findUnique({ where: { id } });
      if (!tt) return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });

      if (tt.category === "CHANGE" || tt.label.toUpperCase() === "CHANGE") {
        return NextResponse.json({ error: "Cannot delete CHANGE types as they are reserved for the approval process." }, { status: 400 });
      }

      const userId = (session.user as any).id;
      if (!(await hasWorkspaceAccess(userId, tt.workspaceId))) {
        return NextResponse.json({ error: "Forbidden access to workspace" }, { status: 403 });
      }
  
      await (prisma as any).ticketType.delete({ where: { id } });
  
      return NextResponse.json({ message: "Deleted" });
    } catch (e) {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
