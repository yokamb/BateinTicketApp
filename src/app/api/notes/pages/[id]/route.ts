import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const page = await prisma.notePage.findUnique({ where: { id } });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(page);
  } catch(e) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, content } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;

    const page = await prisma.notePage.update({
      where: { id },
      data
    });

    return NextResponse.json(page);
  } catch(e) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.notePage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch(e) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}
