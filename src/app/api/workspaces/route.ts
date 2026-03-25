import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const workspaceCount = await prisma.workspace.count({
      where: { adminId: user.id }
    });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const plan = dbUser?.plan || "FREE";

    if (plan === "FREE" && workspaceCount >= 1) {
      return NextResponse.json({ error: "Free plan allows only 1 workspace. Please upgrade to Pro or Max." }, { status: 403 });
    }
    
    if (plan === "PRO" && workspaceCount >= 10) {
      return NextResponse.json({ error: "Pro plan allows up to 10 workspaces. Please upgrade to Max." }, { status: 403 });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        adminId: user.id,
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error("Workspace creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
