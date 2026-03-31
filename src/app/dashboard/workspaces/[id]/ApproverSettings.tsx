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

  const handleRevoke = async (tUser: any) => {
    if (!confirm(`Are you sure you want to revoke access for ${tUser.email}? This will immediately kick them out of the workspace.`)) return;
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/customers/${tUser.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to revoke access");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Shield size={20} className="text-indigo-600" />
            Approvals
        </h2>
        {isApprovalsActive ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1 transition-all duration-500 animate-pulse-subtle shadow-sm shadow-emerald-100">
               <Shield size={10} /> Active
            </span>
        ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-1 transition-all duration-500">
               Disabled
            </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-6 leading-relaxed italic">
        {isApprovalsActive 
          ? "Specialized labels in your workspace require client approval. Add approvers below to manage this workflow." 
          : "Approval workflow is currently disabled. No labels are set to 'Requires Approval'."}
      </p>

      {isApprovalsActive ? (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Manage Approvers</h3>
            <ul className="space-y-3 mb-4">
              {approvers.map((member: any) => (
                  <li key={member.userId} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl text-sm transition-all hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 group/member">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-inner group-hover/member:bg-indigo-50 group-hover/member:border-indigo-100 transition-colors">
                              {member.user.name?.[0] || member.user.email?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                              <span className="font-bold text-slate-900 leading-tight">{member.user.name || "Client"}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{member.user.email}</span>
                          </div>
                      </div>
                      
                      <button 
                         onClick={() => handleRevoke(member.user)}
                         className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/member:opacity-100"
                         title="Revoke Access"
                      >
                          <X size={16} />
                      </button>
                  </li>
              ))}
              {approvers.length === 0 && (
                  <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl text-center bg-slate-50/50">
                      <UserPlus size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No Approvers Yet</p>
                  </div>
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
                        className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold placeholder:text-slate-300 shadow-sm" 
                      />
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="px-6 py-3 bg-[#0d0d0d] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1a1a1a] transition-all flex items-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95"
                      >
                          {loading ? "Creating..." : <><UserPlus size={14} /> Invite</>}
                      </button>
                  </div>
                  
                  {inviteLink && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fade-in flex items-center justify-between">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Account & Invite Generated!</p>
                      <button 
                        type="button" 
                        onClick={() => { navigator.clipboard.writeText(inviteLink); alert("Link copied!"); }}
                        className="text-[10px] font-black text-emerald-800 uppercase hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        Copy Link
                      </button>
                    </div>
                  )}
               </form>
          </div>
        </div>
      ) : (
          <div className="p-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 italic">Workflow Inactive</p>
              <p className="text-[10px] text-slate-500 max-w-[220px] mx-auto leading-relaxed">
                  To use this feature, enable <strong>"Needs Client Approval?"</strong> on any of your ticket labels above.
              </p>
          </div>
      )}
    </div>
  );
}
