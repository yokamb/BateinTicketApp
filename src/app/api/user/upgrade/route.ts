import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, subscriptionId, razorpayPaymentId, isRazorpay } = await req.json();
    if (!["FREE", "PRO", "MAX"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan,
        paypalSubscriptionId: !isRazorpay ? subscriptionId : undefined,
        razorpaySubscriptionId: isRazorpay ? subscriptionId : undefined,
        razorpayPaymentId: isRazorpay ? razorpayPaymentId : undefined,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
