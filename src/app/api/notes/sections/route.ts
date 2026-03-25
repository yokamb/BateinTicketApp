import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const session = await getServerSession(authOptions);

  if (!session || !workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sections = await prisma.noteSection.findMany({
    where: { workspaceId },
    include: { pages: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json(sections);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userSession = session?.user as any;
    if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: userSession.id } });
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, workspaceId } = body;

    if (!name || !workspaceId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (dbUser.plan === "FREE") {
      const existingCount = await prisma.noteSection.count({ where: { workspaceId } });
      if (existingCount >= 1) {
        return NextResponse.json({ error: "Free plan is limited to 1 Note Section. Please upgrade." }, { status: 403 });
      }
    }

    const section = await prisma.noteSection.create({
      data: { name, workspaceId }
    });

    return NextResponse.json(section);
  } catch(e) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}
