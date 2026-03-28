"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Shield, X } from "lucide-react";

export default function ApproverSettings({ workspace }: { workspace: any }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  
  const router = useRouter();

  // Derive activation from labels
  const isApprovalsActive = workspace.ticketTypes?.some((tt: any) => tt.category === "CHANGE") || false;

  // Filter only GUEST members from customers
  const approvers = workspace.customers?.filter((c: any) => c.role === "GUEST") || [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInviteLink(null);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "GUEST" }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmail("");
        setInviteLink(data.inviteLink);
        router.refresh();
      } else {
        alert(data.error || "Failed to create invitation");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield size={20} className="text-indigo-600" />
            Approvals
        </h2>
        {isApprovalsActive ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
               <Shield size={10} /> Active
            </span>
        ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-1">
               Disabled
            </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        {isApprovalsActive 
          ? "Specialized labels in your workspace require client approval. Add approvers below to manage this workflow." 
          : "Approval workflow is currently disabled. No labels are set to 'Requires Approval'."}
      </p>

      {isApprovalsActive ? (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Manage Approvers</h3>
            <ul className="space-y-2 mb-4">
              {approvers.map((member: any) => (
                  <li key={member.userId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm border border-slate-100 group">
                      <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                              {member.user.name?.[0] || member.user.email?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                              <span className="font-bold text-slate-900 leading-tight">{member.user.name || "Client"}</span>
                              <span className="text-[10px] text-slate-500">{member.user.email}</span>
                          </div>
                      </div>
                  </li>
              ))}
              {approvers.length === 0 && (
                  <p className="text-[11px] italic text-slate-400 py-2">No approvers assigned yet.</p>
              )}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Invite New Approver</h3>
              <form onSubmit={handleInvite} className="flex flex-col gap-3">
                  <div className="flex gap-2">
                      <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="client@example.com" 
                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" 
                      />
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="px-4 py-2 bg-[#0d0d0d] text-white font-bold text-xs rounded-xl hover:bg-[#1a1a1a] transition-all flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
                      >
                          {loading ? "Inviting..." : <><UserPlus size={14} /> Invite</>}
                      </button>
                  </div>
                  
                  {inviteLink && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl animate-fade-in">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Invite Created!</p>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[11px] text-emerald-600 font-medium truncate flex-1">{inviteLink}</p>
                        <button 
                          type="button" 
                          onClick={() => { navigator.clipboard.writeText(inviteLink); alert("Link copied!"); }}
                          className="text-[10px] font-black text-emerald-800 uppercase hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
              </form>
          </div>
        </div>
      ) : (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-[11px] text-slate-500 italic">
                  To use this feature, enable <strong>"Needs Client Approval?"</strong> on any of your ticket labels in the section above.
              </p>
          </div>
      )}
    </div>
  );
}
