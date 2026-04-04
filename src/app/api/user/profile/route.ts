import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { computeNextRunAt } from "@/lib/utils/recurring";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      professionalRole: user.professionalRole,
      timezone: user.timezone,
      profile: user.profile,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    
    const { name, email, professionalRole, timezone } = await req.json();

    // Fetch current user to check for timezone change
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { timezone: true, email: true }
    });

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // check if email is taken by another account
    if (email && email !== currentUser.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== user.id) {
          return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    const tzChanged = timezone && timezone !== currentUser.timezone;

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { 
          ...(name && { name }), 
          ...(email && { email }), 
          professionalRole, 
          timezone 
        }
    });

    // If timezone changed, re-sync all recurring templates
    if (tzChanged) {
      const templates = await prisma.recurringTemplate.findMany({
        where: { creatorId: user.id }
      });

      for (const t of templates) {
        const nextRunAt = computeNextRunAt(
          t.frequency,
          t.timeHour,
          t.timeMinute,
          t.dayOfWeek,
          t.dayOfMonth,
          timezone // Use the new timezone
        );

        await prisma.recurringTemplate.update({
          where: { id: t.id },
          data: { nextRunAt }
        });
      }
    }

    return NextResponse.json({ 
      message: tzChanged ? "Profile and schedules updated" : "Profile updated successfully", 
      user: updated 
    }, { status: 200 });
  } catch(e: any) {
    console.error("Profile update error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
