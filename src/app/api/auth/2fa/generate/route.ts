import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id as string } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Generate a secure secret
    const secret = speakeasy.generateSecret({ 
      name: `Batein (${user.email})` 
    });
    
    // Generate a QR code image as base64 data URI
    const qrImageUrl = await qrcode.toDataURL(secret.otpauth_url || "");

    // Save the secret temporarily. We will save it without enabling it yet.
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32 } // Not setting isTwoFactorEnabled yet
    });

    return NextResponse.json({ qrCode: qrImageUrl, secret: secret.base32 });

  } catch (error) {
    console.error("Error generating 2FA:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
