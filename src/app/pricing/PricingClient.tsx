"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, X, Database } from "lucide-react";
import Script from "next/script";

export default function PricingClient({ 
  userPlan,
  isSubscriptionCancelled = false,
  subscriptionExpiresAt = null
}: { 
  userPlan: string,
  isSubscriptionCancelled?: boolean,
  subscriptionExpiresAt?: Date | null
}) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "MAX" | null>(null);
  const [isIndian, setIsIndian] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Basic auto-detection for India based on TimeZone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Calcutta" || tz === "Asia/Kolkata") {
      setIsIndian(true);
    }
  }, []);

  const handleApprove = async (plan: "PRO" | "MAX", data: any, isRazorpay: boolean = false) => {
    const res = await fetch("/api/user/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        plan, 
        subscriptionId: isRazorpay ? data.razorpay_subscription_id : data.subscriptionID,
        razorpayPaymentId: isRazorpay ? data.razorpay_payment_id : undefined,
        isRazorpay 
      }),
    });

    if (res.ok) {
      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 3000);
    } else {
      const data = await res.json();
      console.error("Upgrade error response:", data);
      alert("Subscription created but local account upgrade failed: " + (data.details || "Check console for details"));
    }
    setIsLoading(false);
  };

  const handleRazorpaySubscription = async (plan: "PRO" | "MAX") => {
    setIsLoading(true);
    try {
      const planId = plan === "PRO" 
        ? process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_PRO 
        : process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_MAX;

      if (!planId) {
        alert("Razorpay Plan ID is missing!");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Batein SaaS",
        description: `${plan} Plan Subscription`,
        handler: (response: any) => {
          handleApprove(plan, response, true);
        },
        prefill: {
          name: "", // Can be prefilled if user info available
          email: "",
        },
        theme: {
          color: "#0d0d0d",
        },
        modal: {
          ondismiss: () => setIsLoading(false)
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Razorpay Error:", error);
      alert("Failed to initiate Razorpay: " + error.message);
      setIsLoading(false);
    }
  };

  const handleExpandStorage = async (provider: "razorpay" | "paypal", amountGB: number, data?: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/expand-storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId: provider === "razorpay" ? data.razorpay_order_id : data.orderID,
          amountGB,
          provider
        }),
      });
      if (res.ok) {
        alert("Storage expanded successfully! Your limit has been updated.");
        router.refresh();
      } else {
        const error = await res.json();
        alert("Expansion failed: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Storage Expand Error:", err);
      alert("An error occurred during expansion.");
    } finally {
      setIsLoading(false);
    }
  };

  const expandRazorpayStorage = async (amountGB: number, priceINR: number) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: priceINR }),
      });
      const order = await res.json();

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: "INR",
        name: "Batein Storage Power-Up",
        description: `+${amountGB}GB Lifetime Storage Expansion`,
        order_id: order.orderId,
        handler: (response: any) => handleExpandStorage("razorpay", amountGB, response),
        theme: { color: "#0d0d0d" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Razorpay Power-up Error:", error);
      alert("Failed to initiate Razorpay Expansion: " + error.message);
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will keep your benefits until the end of the billing period.")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/cancel-subscription", { method: "POST" });
      if (res.ok) {
        alert("Subscription cancelled successfully. Your plan will remain active until the end of the period.");
        window.location.reload();
      } else {
        const data = await res.json();
        alert("Cancellation failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("An error occurred during cancellation.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanButtonProps = (planId: string) => {
    if (userPlan === "MAX") return { disabled: true, buttonText: planId === "MAX" ? "Current Plan" : "Included in Max" };
    if (userPlan === "PRO") {
      if (planId === "FREE") return { disabled: true, buttonText: "Current Plan" };
      if (planId === "PRO") return { disabled: true, buttonText: "Current Plan" };
      if (planId === "MAX") return { disabled: false, buttonText: "Upgrade to Max" };
    }
    if (planId === "FREE") return { disabled: true, buttonText: "Current Plan" };
    const textPrefix = userPlan === "FREE" ? "Select" : "Upgrade to";
    if (planId === "PRO") return { disabled: false, buttonText: `${textPrefix} Pro` };
    if (planId === "MAX") return { disabled: false, buttonText: `${textPrefix} Max` };
    return { disabled: true, buttonText: "" };
  };

  const plans = [
    {
      name: "Free",
      id: "FREE",
      price: isIndian ? "₹0" : "$0",
      features: ["2 Workspaces", "2 Notebooks", "50 Tickets", "100 MB Storage"],
      ...getPlanButtonProps("FREE")
    },
    {
      name: "Pro",
      id: "PRO",
      price: isIndian ? "₹169" : "$2",
      features: ["Up to 10 Workspaces", "File Attachments", "Priority Email Support"],
      ...getPlanButtonProps("PRO")
    },
    {
      name: "Max",
      id: "MAX",
      price: isIndian ? "₹499" : "$6",
      features: ["Unlimited Workspaces", "Change Approvals", "Custom Domains", "24/7 Support"],
      ...getPlanButtonProps("MAX")
    }
  ];

  return (
    <PayPalScriptProvider options={{ 
      "clientId": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb", 
      "intent": "subscription",
      "vault": true,
      "components": "buttons",
      "currency": "USD"
    }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="min-h-screen bg-[#f9f9f9] py-20 px-4 font-sans text-[#0d0d0d] antialiased relative">
        <Link 
          href="/dashboard"
          className="absolute top-8 left-8 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-black border border-gray-200 bg-white"
          title="Back to Dashboard"
        >
          <X size={18} />
        </Link>
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Choose Your Plan</h1>
          <p className="text-base text-[#666]">Scale your freelance business with premium features.</p>

          {isSubscriptionCancelled && subscriptionExpiresAt && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 max-w-2xl mx-auto flex items-center justify-center gap-3 shadow-sm">
              <span className="text-lg">⏳</span>
              <p className="text-sm font-medium">
                Your <strong>{userPlan}</strong> plan is cancelled and will expire in <strong>{Math.ceil((new Date(subscriptionExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</strong> ({new Date(subscriptionExpiresAt).toLocaleDateString()}).
              </p>
            </div>
          )}
        </div>

        {isSuccess ? (
          <div className="max-w-md mx-auto p-8 bg-white border border-emerald-100 rounded-2xl text-[#0d0d0d] text-center font-medium shadow-xl shadow-black/[0.03]">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-lg font-bold mb-1">Upgrade Successful!</p>
            <p className="text-sm text-[#666]">We're refreshing your session.</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((pl: any) => (
              <div key={pl.id} className={`bg-white rounded-2xl overflow-hidden border transition-all ${selectedPlan === pl.id ? 'border-[#0d0d0d] shadow-2xl scale-[1.02]' : 'border-[#e5e5e5] shadow-sm'}`}>
                <div className="p-8 pb-6 text-center border-b border-[#f0f0f0]">
                  <h2 className="text-lg font-bold mb-1 text-[#666] tracking-tight">{pl.name}</h2>
                  <div className="text-4xl font-bold text-[#0d0d0d]">{pl.price}<span className="text-sm font-medium text-[#888]">/mo</span></div>
                </div>

                <div className="p-8">
                  <ul className="space-y-3.5 mb-8 min-h-[140px]">
                    {pl.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-[#444]">
                        <div className="w-5 h-5 rounded-full bg-[#f3f3f3] text-[#0d0d0d] flex items-center justify-center shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!pl.disabled && selectedPlan !== pl.id && (
                    <button 
                      onClick={() => setSelectedPlan(pl.id)}
                      className="w-full py-2.5 bg-[#0d0d0d] hover:bg-[#333] text-white font-bold rounded-xl transition-all shadow-md text-sm"
                    >
                      {pl.buttonText}
                    </button>
                  )}

                  {pl.disabled && (
                    <div className="space-y-2">
                      <button disabled className="w-full py-2.5 bg-white text-[#bbb] font-bold rounded-xl border border-[#e5e5e5] cursor-not-allowed text-sm">
                        {pl.buttonText}
                      </button>
                      {pl.id === userPlan && !isSubscriptionCancelled && userPlan !== "FREE" && (
                        <button 
                          onClick={handleCancel}
                          disabled={isLoading}
                          className="w-full py-2 text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors"
                        >
                          Cancel Subscription
                        </button>
                      )}
                    </div>
                  )}

                  {selectedPlan === pl.id && (() => {
                    if (isIndian) {
                      return (
                        <div className="mt-4">
                          <button 
                            disabled={isLoading}
                            onClick={() => handleRazorpaySubscription(pl.id)}
                            className="w-full py-2.5 bg-[#0d0d0d] hover:bg-[#333] text-white font-bold rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing...
                              </>
                            ) : (
                              `Pay ${pl.price} / month`
                            )}
                          </button>
                          <button 
                            disabled={isLoading}
                            onClick={() => setSelectedPlan(null)}
                            className="w-full py-2 mt-2 text-xs text-[#888] hover:text-[#0d0d0d] font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    }

                    const cleanId = (envVar: string | undefined) => {
                      if (!envVar) return "";
                      return envVar.replace(/\\n/g, "").replace(/\n/g, "").trim();
                    };

                    const rawPlanId = pl.id === "PRO" 
                      ? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO 
                      : process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_MAX;

                    const planId = cleanId(rawPlanId);

                    return (
                      <div className="mt-4">
                        <PayPalButtons
                          style={{ layout: "vertical", shape: "rect", color: "black", height: 40 }}
                          createSubscription={(data, actions) => {
                            if (!planId) {
                              alert("PayPal Plan ID is missing!");
                              return Promise.reject("Missing PayPal Plan ID");
                            }
                            return actions.subscription.create({
                              plan_id: planId
                            });
                          }}
                          onApprove={(data, actions) => handleApprove(pl.id, data)}
                          onError={(err: any) => {
                            console.error("PayPal Error:", err);
                            alert("PayPal error: " + (err.message || "Something went wrong during checkout. Please try again."));
                          }}
                          onCancel={() => {
                            alert("Payment cancelled.");
                          }}
                        />
                        <button 
                          onClick={() => setSelectedPlan(null)}
                          className="w-full py-2 mt-2 text-xs text-[#888] hover:text-[#0d0d0d] font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- Storage Power-Ups --- */}
        <div className="max-w-4xl mx-auto mt-24 mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-4">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Add-ons</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#0d0d0d]">Storage Power-Ups</h2>
          <p className="text-sm text-[#666]">Expand your file attachment limit forever with a one-time purchase.</p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {[
            { id: "2GB", name: "+2GB Storage", price: isIndian ? "₹199" : "$3", amount: 2, priceVal: 199, usdPrice: "3.00" },
            { id: "5GB", name: "+5GB Storage", price: isIndian ? "₹399" : "$6", amount: 5, priceVal: 399, usdPrice: "6.00" }
          ].map((addon) => (
            <div key={addon.id} className="bg-white border border-[#e5e5e5] rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0d0d0d]">{addon.name}</h3>
                  <p className="text-xs text-[#888]">One-time lifetime expansion</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-[#0d0d0d] mb-2">{addon.price}</div>
                {isIndian ? (
                  <button 
                    onClick={() => expandRazorpayStorage(addon.amount, addon.priceVal)}
                    disabled={isLoading}
                    className="px-4 py-1.5 bg-[#0d0d0d] hover:bg-[#333] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "..." : "Buy Now"}
                  </button>
                ) : (
                  <div className="w-32">
                    <PayPalButtons 
                      style={{ layout: 'horizontal', color: 'black', shape: 'rect', label: 'pay', height: 32, tagline: false }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [{
                            description: `${addon.name} Lifetime Expansion`,
                            amount: { currency_code: "USD", value: addon.usdPrice }
                          }],
                          intent: "CAPTURE"
                        });
                      }}
                      onApprove={async (data, actions) => {
                        await handleExpandStorage("paypal", addon.amount, data);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
