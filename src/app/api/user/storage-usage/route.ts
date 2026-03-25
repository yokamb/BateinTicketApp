import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

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

    const result = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM(a.size), 0) as total
      FROM "Attachment" a
      JOIN "Ticket" t ON a."ticketId" = t.id
      JOIN "Workspace" w ON t."workspaceId" = w.id
      WHERE w."adminId" = ${dbUser.id}
    `;
    const usedBytes = Number(result[0]?.total ?? 0);

    return NextResponse.json({ usedBytes, totalLimit, planLimit: baseLimit, additionalLimit: additionalGB * 1024 * 1024 * 1024, plan });
  } catch (error: any) {
    console.error("Storage usage error:", error?.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
