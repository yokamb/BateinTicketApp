import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function hasWorkspaceAccess(userId: string, workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { customers: true }
  });

  if (!workspace) return false;
  if (workspace.adminId === userId) return true;
  return workspace.customers.some((c: any) => c.userId === userId);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasWorkspaceAccess(user.id, id))) {
       return NextResponse.json({ error: "Forbidden access to workspace" }, { status: 403 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace || workspace.adminId !== user.id) {
       return NextResponse.json({ error: "Only the Workspace Owner can modify settings" }, { status: 403 });
    }

    const { requiresChangeApproval, name } = await req.json();

    const data: any = {};
    if (requiresChangeApproval !== undefined) data.requiresChangeApproval = requiresChangeApproval;
    if (name !== undefined) data.name = name;

    const updated = await prisma.workspace.update({
        where: { id },
        data
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Workspace settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
