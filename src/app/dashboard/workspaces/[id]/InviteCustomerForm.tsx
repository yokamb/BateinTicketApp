"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export default function InviteCustomerForm({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setEmail("");
        setName("");
        setMessage({ text: data.message || "Invite sent!", type: "success" });
        if (data.tempPassword) {
            // For MVP: Show the password so the tester can log in
            alert(`Customer created! Temp password is: ${data.tempPassword} \n(Normally sent via email)`);
        }
        router.refresh();
      } else {
        setMessage({ text: data.error || "Failed to invite customer", type: "error" });
      }
    } catch (e: any) {
      setMessage({ text: e.message || "An error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleInvite} className="flex flex-col gap-3">
      {message && (
        <div className={`p-2 text-xs rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        placeholder="Customer Name"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        placeholder="customer@example.com"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors text-sm disabled:opacity-70 border border-indigo-100"
      >
        <Send size={16} />
        {loading ? "Inviting..." : "Invite & Grant Access"}
      </button>
    </form>
  );
}
