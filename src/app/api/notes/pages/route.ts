import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userSession = session?.user as any;
    if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: userSession.id } });
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, sectionId, workspaceId } = body;

    if (!title || !sectionId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (dbUser.plan === "FREE") {
      const existingCount = await prisma.notePage.count({
        where: { section: { workspaceId } }
      });
      if (existingCount >= 5) {
        return NextResponse.json({ error: "Free plan is limited to 5 Pages. Please upgrade to Pro." }, { status: 403 });
      }
    }

    const page = await prisma.notePage.create({
      data: {
        title,
        sectionId,
        creatorId: dbUser.id
      }
    });

    return NextResponse.json(page);
  } catch(e) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}
