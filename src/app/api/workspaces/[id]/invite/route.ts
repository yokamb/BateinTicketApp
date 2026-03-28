import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = id;
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Verify workspace access (either owner or member)
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { customers: true }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const isOwner = workspace.adminId === user.id;
    const isMember = workspace.customers.some((c: any) => c.userId === user.id);

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this workspace." }, { status: 403 });
    }

    // Check plan limits for customer sharing
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const plan = dbUser?.plan || "FREE";
    
    if (plan === "FREE") {
      const customerCount = await prisma.instanceAccess.count({
        where: { workspaceId }
      });
      if (customerCount >= 2) {
        return NextResponse.json({ 
          error: "Free plan is limited to 2 customers per workspace. Please upgrade to Pro or Max." 
        }, { status: 403 });
      }
    }

    // Check if user exists
    let customerUser = await prisma.user.findUnique({
      where: { email },
    });

    let tempPassword = null;

    if (!customerUser) {
      // Create user if they don't exist
      tempPassword = Math.random().toString(36).slice(-8); // Random 8 char password
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      
      customerUser = await prisma.user.create({
        data: {
          email,
          name: name || "Customer",
          passwordHash,
          role: "ADMIN", // set every user to ADMIN as requested
        },
      });
      // In a real app we would send the email here with their temp password
      // e.g. sendEmail(email, "You have been invited", `Your password is ${tempPassword}`)
    }

    // Link customer to workspace
    const existingAccess = await prisma.instanceAccess.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: customerUser.id,
        },
      },
    });

    if (existingAccess) {
      return NextResponse.json({ error: "User is already in this workspace" }, { status: 400 });
    }

    await prisma.instanceAccess.create({
      data: {
        workspaceId,
        userId: customerUser.id,
      },
    });

    return NextResponse.json(
      { message: "Customer invited successfully", tempPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
