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

    // Check plan limits for file size
    const user = session.user as any;
    const dbUser = await prisma.user.findFirst({
      where: {
        id: user.id
      }
    });
    const plan = dbUser?.plan || "FREE";
    const maxSize = (plan === "MAX") ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Your ${plan} plan allows up to ${maxSize / (1024 * 1024)}MB per file.` 
      }, { status: 400 });
    }

    // Upload to Vercel Blob (persistent CDN storage)
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    const attachment = await prisma.attachment.create({
      data: {
        fileUrl: blob.url,
        ticketId: id,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
