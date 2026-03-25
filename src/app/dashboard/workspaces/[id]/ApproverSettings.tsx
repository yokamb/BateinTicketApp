"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Shield, X } from "lucide-react";

export default function ApproverSettings({ workspace }: { workspace: any }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await fetch(`/api/workspaces/${workspace.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiresChangeApproval: !workspace.requiresChangeApproval }),
      });
      router.refresh();
    } catch(e) { console.error(e); }
    finally { setIsToggling(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/approvers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setEmail("");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add approver");
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield size={20} className="text-indigo-600" />
            Approvals
        </h2>
        <button 
           onClick={handleToggle}
           disabled={isToggling}
           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${workspace.requiresChangeApproval ? 'bg-indigo-600' : 'bg-slate-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${workspace.requiresChangeApproval ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-6">
        {workspace.requiresChangeApproval 
          ? "Change (CHG) tickets require approval before they can be resolved." 
          : "Approval workflow is currently disabled. Anyone can resolve Change tickets."}
      </p>

      {workspace.requiresChangeApproval && (
          <>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Assigned Approvers</h3>
            <ul className="space-y-2 mb-4">
              {workspace.approvers?.map((app: any) => (
                  <li key={app.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm border border-slate-100">
                      <span className="font-medium text-slate-700 truncate">{app.user.name || app.user.email}</span>
                  </li>
              ))}
              {(!workspace.approvers || workspace.approvers.length === 0) && (
                  <p className="text-xs italic text-slate-400">No approvers assigned. Please add one below.</p>
              )}
            </ul>

            <form onSubmit={handleAdd} className="flex gap-2">
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Approver's email..." 
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500" 
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-medium text-sm rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1"
                >
                    <UserPlus size={16} /> Add
                </button>
            </form>
          </>
      )}
    </div>
  );
}
