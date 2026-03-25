import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    // Check plan limits for per-file size
    const userSession = session.user as any;
    const dbUser = await (prisma as any).user.findUnique({ where: { id: userSession.id } });
    
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plan: string = dbUser.plan || "FREE";
    const maxFileSizeBytes = (plan === "MAX") ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (file.size > maxFileSizeBytes) {
      return NextResponse.json({ 
        error: `File too large. Your ${plan} plan allows up to ${maxFileSizeBytes / (1024 * 1024)}MB per file.` 
      }, { status: 400 });
    }

    // Check total storage quota
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

    if (usedBytes + file.size > totalLimit) {
      return NextResponse.json({ 
        error: `Storage limit exceeded. You have used ${Math.round(usedBytes / (1024 * 1024))}MB of ${Math.round(totalLimit / (1024 * 1024))}MB.` 
      }, { status: 403 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Create attachment record and update size with raw query to avoid type issues
    const attachment = await prisma.attachment.create({
      data: {
        fileUrl: blob.url,
        ticketId: id,
      },
    });

    // Update size separately via raw SQL
    await prisma.$executeRaw`
      UPDATE "Attachment" SET size = ${BigInt(file.size)} WHERE id = ${attachment.id}
    `;

    return NextResponse.json({
      id: attachment.id,
      fileUrl: attachment.fileUrl,
      ticketId: attachment.ticketId,
      size: file.size,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Upload error:", error?.message || error);
    return NextResponse.json({ error: "Upload failed: " + (error?.message || "Unknown error") }, { status: 500 });
  }
}
