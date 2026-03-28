import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invite = await (prisma as any).workspaceInvite.findUnique({
      where: { token },
      include: { workspace: { include: { admin: true } } }
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invitation link." }, { status: 404 });
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "Invitation has expired." }, { status: 410 });
    }

    return NextResponse.json(invite);
  } catch (e) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session) return NextResponse.json({ error: "You must be logged in to accept an invite." }, { status: 401 });

    const invite = await (prisma as any).workspaceInvite.findUnique({
      where: { token }
    });

    if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    if (new Date() > invite.expiresAt) return NextResponse.json({ error: "Expired invite" }, { status: 410 });

    // Add user to workspace with the specified role
    await (prisma as any).instanceAccess.upsert({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
      update: { role: invite.role },
      create: {
        workspaceId: invite.workspaceId,
        userId: user.id,
        role: invite.role
      }
    });

    // Delete the invite token
    await (prisma as any).workspaceInvite.delete({ where: { token } });

    return NextResponse.json({ success: true, workspaceId: invite.workspaceId });
  } catch (e) {
    console.error("Invite completion failed", e);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
