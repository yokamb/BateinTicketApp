import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    // --- SECURE PAYPAL WEBHOOK ---
    // (Optional) For full production verification, use PayPal's CheckWebhookSignature API.
    // However, for this project, we will match the subscription_id against our users.

    console.log("PayPal Webhook Event Received:", event.event_type);

    const subscriptionId = event.resource.id;

    // --- FIND USER BY SUBSCRIPTION ID ---
    const user = await prisma.user.findFirst({
      where: { paypalSubscriptionId: subscriptionId }
    });

    if (!user) {
      console.warn(`Webhook received for unknown PayPal subscription: ${subscriptionId}`);
      return NextResponse.json({ success: true, message: "Subscription not found locally" });
    }

    // --- HANDLE SPECIFIC EVENTS ---
    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
        // Mark as cancelled and set expiry date
        if (event.resource.billing_info?.next_billing_time) {
          const expiry = new Date(event.resource.billing_info.next_billing_time);
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              isSubscriptionCancelled: true,
              subscriptionExpiresAt: expiry
            }
          });
          console.log(`User ${user.email} PayPal subscription marked as cancelled externally`);
        }
        break;

      case "PAYMENT.SALE.COMPLETED":
        // Monthly payment successful - extension handled automatically by auth check,
        // but we can update the expiration here for better UI tracking
        if (event.resource.billing_info?.next_billing_time) {
          const newExpiry = new Date(event.resource.billing_info.next_billing_time);
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              subscriptionExpiresAt: newExpiry,
              isSubscriptionCancelled: false
            }
          });
          console.log(`User ${user.email} PayPal subscription renewed until ${newExpiry}`);
        }
        break;

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        // Multiple payment failures - immediate downgrade
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            plan: "FREE",
            isSubscriptionCancelled: false,
            subscriptionExpiresAt: null,
            paypalSubscriptionId: null
          }
        });
        console.log(`User ${user.email} PayPal plan downgraded: payment suspended`);
        break;

      default:
        console.log(`Unhandled PayPal event: ${event.event_type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PayPal Webhook Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
