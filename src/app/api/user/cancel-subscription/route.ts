import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Get a PayPal server-side OAuth2 access token
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET env var is missing");
  }

  const base =
    process.env.PAYPAL_ENV === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal token error: ${err}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Fetch the current user
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        paypalSubscriptionId: true, 
        razorpaySubscriptionId: true,
        plan: true 
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.plan === "FREE") {
      return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
    }

    let expirationDate: Date | null = null;
    let cancelledOnProvider = false;

    // --- HANDLE PAYPAL CANCELLATION ---
    if (dbUser.paypalSubscriptionId) {
      try {
        const accessToken = await getPayPalAccessToken();
        const base = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

        // 1. Fetch Subscription Details to get next billing time
        const detailsRes = await fetch(`${base}/v1/billing/subscriptions/${dbUser.paypalSubscriptionId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (detailsRes.ok) {
          const details = await detailsRes.json();
          if (details.billing_info?.next_billing_time) {
            expirationDate = new Date(details.billing_info.next_billing_time);
          }
        }

        // 2. Cancel the subscription
        const cancelRes = await fetch(`${base}/v1/billing/subscriptions/${dbUser.paypalSubscriptionId}/cancel`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: "User requested cancellation" }),
        });

        if (cancelRes.status === 204) {
          cancelledOnProvider = true;
        } else {
          console.error("PayPal cancel failure status:", cancelRes.status);
        }
      } catch (err) {
        console.error("PayPal cancellation error:", err);
      }
    }

    // --- HANDLE RAZORPAY CANCELLATION ---
    if (dbUser.razorpaySubscriptionId) {
      try {
        // 1. Fetch details for expiry
        const subscription = await razorpay.subscriptions.fetch(dbUser.razorpaySubscriptionId);
        if (subscription.current_end) {
          expirationDate = new Date(subscription.current_end * 1000);
        }

        // 2. Cancel at end of cycle (Razorpay supports this natively)
        await (razorpay.subscriptions as any).cancel(dbUser.razorpaySubscriptionId, {
          cancel_at_cycle_end: 1
        });
        cancelledOnProvider = true;
      } catch (err) {
        console.error("Razorpay cancellation error:", err);
      }
    }

    // --- UPDATE LOCAL DATABASE ---
    // Instead of immediate FREE, we set the expiry date and cancellation flag
    const finalExpiry = expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Fallback to 30 days if fetch fails

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isSubscriptionCancelled: true,
        subscriptionExpiresAt: finalExpiry,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Subscription marked for cancellation",
      expiresAt: finalExpiry
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
