import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is missing");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // --- VERIFY SIGNATURE ---
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid Razorpay Webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log("Razorpay Webhook Event Received:", event.event);

    const subscription = event.payload.subscription.entity;
    const subscriptionId = subscription.id;

    // --- FIND USER BY SUBSCRIPTION ID ---
    const user = await prisma.user.findFirst({
      where: { razorpaySubscriptionId: subscriptionId }
    });

    if (!user) {
      console.warn(`Webhook received for unknown subscription: ${subscriptionId}`);
      return NextResponse.json({ success: true, message: "Subscription not found locally" });
    }

    // --- HANDLE SPECIFIC EVENTS ---
    switch (event.event) {
      case "subscription.charged":
        // Monthly payment successful - extend expiry
        if (subscription.current_end) {
          const newExpiry = new Date(subscription.current_end * 1000);
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              subscriptionExpiresAt: newExpiry,
              isSubscriptionCancelled: subscription.status === "cancelled" || subscription.status === "pending_cancel"
            }
          });
          console.log(`User ${user.email} subscription renewed until ${newExpiry}`);
        }
        break;

      case "subscription.cancelled":
        // External cancellation (from Razorpay dashboard)
        if (subscription.current_end) {
          const expiry = new Date(subscription.current_end * 1000);
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              isSubscriptionCancelled: true,
              subscriptionExpiresAt: expiry
            }
          });
          console.log(`User ${user.email} subscription marked as cancelled externally`);
        }
        break;

      case "subscription.halted":
        // Multiple payment failures - immediate downgrade
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            plan: "FREE",
            isSubscriptionCancelled: false,
            subscriptionExpiresAt: null,
            razorpaySubscriptionId: null,
            razorpayPaymentId: null
          }
        });
        console.log(`User ${user.email} plan downgraded: payment failed/halted`);
        break;

      default:
        console.log(`Unhandled Razorpay event: ${event.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
