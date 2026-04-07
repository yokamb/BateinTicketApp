import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id as string } });
    if (!user || !user.twoFactorSecret) return NextResponse.json({ error: "2FA not initialized" }, { status: 400 });

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1 // allows 1 step before/after (30 seconds) tolerance for clock drift
    });

    if (isValid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isTwoFactorEnabled: true }
      });
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error verifying 2FA:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
