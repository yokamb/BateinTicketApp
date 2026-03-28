import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_TICKET_MAPPINGS } from "@/lib/constants/roles";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });

    // Fetch custom ticket types from DB
    let ticketTypes = await (prisma as any).ticketType.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });

    // If no custom types, use defaults based on user role
    if (ticketTypes.length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { professionalRole: true },
      });

      const roleMapping = ROLE_TICKET_MAPPINGS.find(m => m.role === user?.professionalRole) || ROLE_TICKET_MAPPINGS[0];
      
      ticketTypes = [
        { id: "default-issue", label: roleMapping.issue, category: "ISSUE", workspaceId },
        { id: "default-request", label: roleMapping.request, category: "REQUEST", workspaceId },
        { id: "default-change", label: roleMapping.change, category: "CHANGE", workspaceId },
      ] as any;
    }

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

    const ticketType = await (prisma as any).ticketType.create({
      data: { workspaceId, label, category },
    });

    return NextResponse.json(ticketType);
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
  
      await (prisma as any).ticketType.delete({ where: { id } });
  
      return NextResponse.json({ message: "Deleted" });
    } catch (e) {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
