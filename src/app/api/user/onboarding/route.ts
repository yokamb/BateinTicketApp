import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { professionalRole, customLabels } = await req.json();
    if (!professionalRole) {
      return NextResponse.json({ error: "Professional role required" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // 1. Update user profile
    await (prisma as any).user.update({
      where: { id: userId },
      data: { 
        professionalRole,
        profile: {
          upsert: {
            create: { role: professionalRole },
            update: { role: professionalRole }
          }
        }
      }
    });

    // 2. Find or create default workspace
    let workspace = await (prisma as any).workspace.findFirst({
        where: { adminId: userId }
    });

    if (!workspace) {
        workspace = await (prisma as any).workspace.create({
            data: {
                name: "My Workspace",
                adminId: userId
            }
        });
    }

    // 3. Create Ticket Types for this workspace
    if (customLabels && Array.isArray(customLabels)) {
        // Clear existing default types if any
        await (prisma as any).ticketType.deleteMany({
            where: { workspaceId: workspace.id }
        });

        // Create new ones
        for (const labelData of customLabels) {
            await (prisma as any).ticketType.create({
                data: {
                    label: labelData.label,
                    category: labelData.category,
                    workspaceId: workspace.id
                }
            });
        }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
