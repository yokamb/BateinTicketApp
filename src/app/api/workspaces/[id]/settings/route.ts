import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { requiresChangeApproval } = await req.json();

    const updated = await prisma.workspace.update({
        where: { id },
        data: { requiresChangeApproval }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Workspace settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
