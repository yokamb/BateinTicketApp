import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace || workspace.adminId !== user.id) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const approverUser = await prisma.user.findUnique({ where: { email } });
    if (!approverUser) {
        return NextResponse.json({ error: "User with this email not found. They must register first." }, { status: 404 });
    }

    const existing = await prisma.workspaceApprover.findFirst({
        where: { workspaceId: id, userId: approverUser.id }
    });
    if (existing) {
        return NextResponse.json({ error: "User is already an approver" }, { status: 400 });
    }

    const newApprover = await prisma.workspaceApprover.create({
        data: {
            workspaceId: id,
            userId: approverUser.id
        },
        include: { user: true }
    });

    return NextResponse.json(newApprover);
  } catch (error) {
    console.error("Workspace approver error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
