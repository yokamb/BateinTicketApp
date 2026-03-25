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
    // For subscriptions, onApprove receives data.subscriptionID.
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
    // userPlan === "FREE"
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
      features: ["1 Workspace Limit", "Basic Ticketing", "Standard Support"],
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

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 animate-fade-in-up">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Choose Your Plan</h1>
        <p className="text-xl text-slate-500">Scale your freelance business with premium features.</p>
      </div>

      {isSuccess ? (
        <div className="max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-center font-medium shadow-sm">
          <div className="text-4xl mb-4">🎉</div>
          Payment Successful! You've been upgraded. Redirecting...
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((pl: any) => (
            <div key={pl.id} className={`bg-white rounded-3xl overflow-hidden shadow-lg border-2 ${selectedPlan === pl.id ? 'border-indigo-500 ring-4 ring-indigo-50 transform scale-105' : 'border-transparent'} transition-all`}>
              <div className="p-8 text-center bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                <h2 className="text-2xl font-bold mb-2">{pl.name}</h2>
                <div className="text-5xl font-black mb-1">{pl.price}<span className="text-lg font-medium opacity-80">/mo</span></div>
              </div>

              <div className="p-8">
                <ul className="space-y-4 mb-8 min-h-[160px]">
                  {pl.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Check size={12} />
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                {!pl.disabled && selectedPlan !== pl.id && (
                  <button 
                    onClick={() => setSelectedPlan(pl.id)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors"
                  >
                    Select {pl.name}
                  </button>
                )}

                {pl.disabled && (
                  <button disabled className="w-full py-3 bg-slate-50 text-slate-400 font-bold rounded-xl border border-slate-200 cursor-not-allowed">
                    {pl.buttonText}
                  </button>
                )}

                {selectedPlan === pl.id && (
                  <div className="mt-4 animate-fade-in-up">
                    <PayPalScriptProvider options={{ 
                      "clientId": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb", 
                      "intent": "subscription",
                      "vault": true,
                      "components": "buttons",
                      "enable-funding": "card",
                    }}>
                      <PayPalButtons
                        style={{ layout: "vertical", shape: "rect", color: "blue", height: 40 }}
                        createSubscription={(data, actions) => {
                          const planId = pl.id === "PRO" 
                            ? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO 
                            : process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_MAX;
                            
                          if (!planId) {
                            alert("PayPal Plan ID is missing! Next.js failed to load it. I'm automatically restarting your server to pull in the fresh .env variables.");
                            return Promise.reject("Missing PayPal Plan ID");
                          }

                          return actions.subscription.create({
                            plan_id: planId
                          });
                        }}
                        onApprove={(data, actions) => handleApprove(pl.id, data, actions)}
                      />
                    </PayPalScriptProvider>
                    <button 
                      onClick={() => setSelectedPlan(null)}
                      className="w-full py-2 mt-2 text-sm text-slate-500 hover:text-slate-700"
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
  );
}
