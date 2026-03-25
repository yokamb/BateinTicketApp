import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Fetch the current user with their PayPal subscription ID
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { paypalSubscriptionId: true, plan: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.plan === "FREE") {
      return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
    }

    // Cancel on PayPal if we have a subscription ID
    if (dbUser.paypalSubscriptionId) {
      try {
        const accessToken = await getPayPalAccessToken();

        const base =
          process.env.PAYPAL_ENV === "live"
            ? "https://api-m.paypal.com"
            : "https://api-m.sandbox.paypal.com";

        const cancelRes = await fetch(
          `${base}/v1/billing/subscriptions/${dbUser.paypalSubscriptionId}/cancel`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason: "User requested cancellation" }),
          }
        );

        // 204 = success, anything else is an error
        if (cancelRes.status !== 204) {
          const errText = await cancelRes.text();
          console.error("PayPal cancel error:", cancelRes.status, errText);
          // Still proceed to downgrade locally — don't block user if PayPal call fails
        }
      } catch (paypalErr) {
        console.error("Failed to cancel PayPal subscription:", paypalErr);
        // Still proceed to downgrade locally
      }
    }

    // Downgrade plan locally and clear the stored subscription ID
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "FREE",
        paypalSubscriptionId: null,
      },
    });

    return NextResponse.json({ success: true, message: "Subscription cancelled" });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
