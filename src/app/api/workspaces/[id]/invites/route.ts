import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { email, role } = await req.json();

    // Check if the user is the admin of the workspace
    const ws = await (prisma as any).workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!ws || ws.adminId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await (prisma as any).workspaceInvite.create({
      data: {
        email,
        workspaceId,
        role: role || "GUEST",
        token,
        expiresAt,
      },
      include: { workspace: { include: { admin: true } } }
    });

    // Send the invitation email
    const inviteLink = `${process.env.NEXTAUTH_URL}/invite/${token}`;
    try {
        const { sendWorkspaceInviteEmail } = await import("@/lib/email");
        await sendWorkspaceInviteEmail(
            email,
            invite.workspace.name,
            invite.workspace.admin.name || invite.workspace.admin.email || "A Workspace Owner",
            token
        );
    } catch (emailError) {
        console.error("Failed to send invite email:", emailError);
    }

    return NextResponse.json({ invite, inviteLink }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
        return NextResponse.json({ error: "An invite for this email already exists in this workspace." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: workspaceId } = await params;
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const invites = await (prisma as any).workspaceInvite.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" }
      });
  
      return NextResponse.json(invites);
    } catch (e) {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
