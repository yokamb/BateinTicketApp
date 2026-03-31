import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: workspaceId, userId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify workspace ownership
    const workspace = await (prisma as any).workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || workspace.adminId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Remove access to THIS workspace
    await (prisma as any).instanceAccess.delete({
      where: { 
        workspaceId_userId: { 
          workspaceId, 
          userId 
        } 
      }
    });

    // 2. Clean up User if they have NO other workspaces and were a Guest account
    // We check if they have any other InstanceAccess or if they OWN any workspaces.
    const otherAccessCount = await (prisma as any).instanceAccess.count({ where: { userId } });
    const ownedCount = await (prisma as any).workspace.count({ where: { adminId: userId } });
    
    const targetUser = await (prisma as any).user.findUnique({ 
        where: { id: userId },
        select: { mustChangePassword: true }
    });

    // If they were a brand-new auto-generated guest with NO other ties, delete them entirely
    if (otherAccessCount === 0 && ownedCount === 0 && targetUser?.mustChangePassword) {
        await (prisma as any).user.delete({ where: { id: userId } });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Revoke failed", e);
    return NextResponse.json({ error: "Failed to revoke access" }, { status: 500 });
  }
}
