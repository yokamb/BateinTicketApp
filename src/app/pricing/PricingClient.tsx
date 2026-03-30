"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export default function PricingClient({ userPlan }: { userPlan: string }) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "MAX" | null>(null);
  const router = useRouter();

  const handleApprove = async (plan: "PRO" | "MAX", data: any, actions: any) => {
    const res = await fetch("/api/user/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, subscriptionId: data.subscriptionID }),
    });

    if (res.ok) {
      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 3000);
    } else {
      alert("Subscription created but local account upgrade failed. Contact support.");
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
    if (planId === "PRO") return { disabled: false, buttonText: "Upgrade to Pro" };
    if (planId === "MAX") return { disabled: false, buttonText: "Upgrade to Max" };
    return { disabled: true, buttonText: "" };
  };

  const plans = [
    {
      name: "Free",
      id: "FREE",
      price: "$0",
      features: ["2 Workspaces", "2 Notebooks", "50 Tickets", "100 MB Storage"],
      ...getPlanButtonProps("FREE")
    },
    {
      name: "Pro",
      id: "PRO",
      price: "$2",
      features: ["Up to 10 Workspaces", "File Attachments", "Priority Email Support"],
      ...getPlanButtonProps("PRO")
    },
    {
      name: "Max",
      id: "MAX",
      price: "$6",
      features: ["Unlimited Workspaces", "Change Approvals", "Custom Domains", "24/7 Support"],
      ...getPlanButtonProps("MAX")
    }
  ];

  const isSandbox = !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID === "sb";
  const isProduction = typeof window !== "undefined" && !window.location.hostname.includes("localhost");

  return (
    <PayPalScriptProvider options={{ 
      "clientId": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb", 
      "intent": "subscription",
      "vault": true,
      "components": "buttons",
      "currency": "USD"
    }}>
      <div className="min-h-screen bg-[#f9f9f9] py-20 px-4 font-sans text-[#0d0d0d] antialiased">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Choose Your Plan</h1>
          <p className="text-base text-[#666]">Scale your freelance business with premium features.</p>

          {isSandbox && isProduction && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-semibold animate-pulse inline-block">
              ⚠️ Warning: You are using the default Sandbox (sb) PayPal ID on a production domain. Subscriptions will not work.
            </div>
          )}
        </div>

        {isSuccess ? (
          <div className="max-w-md mx-auto p-8 bg-white border border-emerald-100 rounded-2xl text-[#0d0d0d] text-center font-medium shadow-xl shadow-black/[0.03]">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-lg font-bold mb-1">Upgrade Successful!</p>
            <p className="text-sm text-[#666]">We're redirecting you to your dashboard.</p>
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
                      Select {pl.name}
                    </button>
                  )}

                  {pl.disabled && (
                    <button disabled className="w-full py-2.5 bg-white text-[#bbb] font-bold rounded-xl border border-[#e5e5e5] cursor-not-allowed text-sm">
                      {pl.buttonText}
                    </button>
                  )}

                  {selectedPlan === pl.id && (
                    <div className="mt-4">
                      <PayPalButtons
                        style={{ layout: "vertical", shape: "rect", color: "black", height: 40 }}
                        createSubscription={(data, actions) => {
                          const cleanId = (envVar: string | undefined) => {
                            if (!envVar) return "";
                            // Remove actual newlines, literal '\n' strings, and surrounding whitespace
                            return envVar.replace(/\\n/g, "").replace(/\n/g, "").trim();
                          };

                          const planId = pl.id === "PRO" 
                            ? cleanId(process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO) 
                            : cleanId(process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_MAX);
                            
                          if (!planId) {
                            alert("PayPal Plan ID is missing! Next.js failed to load it.");
                            return Promise.reject("Missing PayPal Plan ID");
                          }

                          return actions.subscription.create({
                            plan_id: planId
                          });
                        }}
                        onApprove={(data, actions) => handleApprove(pl.id, data, actions)}
                        onError={(err) => {
                          console.error("PayPal Error:", err);
                          alert("PayPal error: " + (err.message || "The payment window closed unexpectedly. This usually happens if your PayPal Client ID and Plan IDs don't match, or if you are using Sandbox IDs in Production."));
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
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PayPalScriptProvider>
  );
}
