import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    
    const { name, email, professionalRole, timezone } = await req.json();
    if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });

    const user = session.user as any;
    
    // check if email is taken by another account
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name, email, professionalRole, timezone }
    });

    return NextResponse.json({ message: "Profile updated successfully", user: updated }, { status: 200 });
  } catch(e) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
