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

    const { professionalRole } = await req.json();
    if (!professionalRole) {
      return NextResponse.json({ error: "Professional role required" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Update user and their profile
    await prisma.user.update({
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
