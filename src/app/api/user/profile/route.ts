import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { name, email, professionalRole } = await req.json();
    if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });

    const user = session.user as any;
    
    // check if email is taken by another account
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name, email, professionalRole }
    });

    return NextResponse.json({ message: "Profile updated successfully", user: updated }, { status: 200 });
  } catch(e) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
