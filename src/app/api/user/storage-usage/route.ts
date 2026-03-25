import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userSession = session.user as any;
    const dbUser = await (prisma as any).user.findUnique({ where: { id: userSession.id } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plan: string = dbUser.plan || "FREE";
    const planLimits: Record<string, number> = {
      FREE: 100 * 1024 * 1024,
      PRO: 1024 * 1024 * 1024,
      MAX: 5 * 1024 * 1024 * 1024,
    };
    const baseLimit = planLimits[plan] ?? planLimits.FREE;
    const additionalGB: number = dbUser.additionalStorageGB ?? 0;
    const totalLimit = baseLimit + additionalGB * 1024 * 1024 * 1024;

    // 1. Ticket file attachment sizes (tracked in size column)
    const attachmentResult = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM(a.size), 0) as total
      FROM "Attachment" a
      JOIN "Ticket" t ON a."ticketId" = t.id
      JOIN "Workspace" w ON t."workspaceId" = w.id
      WHERE w."adminId" = ${dbUser.id}
    `;
    const attachmentBytes = Number(attachmentResult[0]?.total ?? 0);

    // 2. Ticket text content (descriptions + comments)
    const ticketContentResult = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(
        SUM(
          OCTET_LENGTH(COALESCE(t.description, '')) +
          COALESCE((SELECT SUM(OCTET_LENGTH(COALESCE(c.text, ''))) FROM "Comment" c WHERE c."ticketId" = t.id), 0)
        ), 0
      ) as total
      FROM "Ticket" t
      JOIN "Workspace" w ON t."workspaceId" = w.id
      WHERE w."adminId" = ${dbUser.id}
    `;
    const ticketTextBytes = Number(ticketContentResult[0]?.total ?? 0);

    // 3. Notebook page content (HTML text + any embedded images or content)
    const noteContentResult = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM(OCTET_LENGTH(COALESCE(np.content, ''))), 0) as total
      FROM "NotePage" np
      JOIN "NoteSection" ns ON np."sectionId" = ns.id
      JOIN "Workspace" w ON ns."workspaceId" = w.id
      WHERE w."adminId" = ${dbUser.id}
    `;
    const noteBytes = Number(noteContentResult[0]?.total ?? 0);

    const usedBytes = attachmentBytes + ticketTextBytes + noteBytes;

    const breakdown = {
      attachmentBytes,
      ticketTextBytes,
      noteBytes,
    };

    return NextResponse.json({ 
      usedBytes, 
      totalLimit, 
      planLimit: baseLimit, 
      additionalLimit: additionalGB * 1024 * 1024 * 1024, 
      plan,
      breakdown
    });
  } catch (error: any) {
    console.error("Storage usage error:", error?.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
