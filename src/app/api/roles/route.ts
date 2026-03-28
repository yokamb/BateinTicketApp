import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await (prisma as any).roleConfig.findMany({
      orderBy: { roleName: "asc" },
    });
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
