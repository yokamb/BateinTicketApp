"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import Script from "next/script";

export default function PricingClient({ userPlan }: { userPlan: string }) {
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
      alert("Subscription created but local account upgrade failed. Contact support.");
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
      <div className="min-h-screen bg-[#f9f9f9] py-20 px-4 font-sans text-[#0d0d0d] antialiased">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Choose Your Plan</h1>
          <p className="text-base text-[#666]">Scale your freelance business with premium features.</p>
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
                    <button disabled className="w-full py-2.5 bg-white text-[#bbb] font-bold rounded-xl border border-[#e5e5e5] cursor-not-allowed text-sm">
                      {pl.buttonText}
                    </button>
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
      </div>
    </PayPalScriptProvider>
  );
}
