"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

export default function TicketForm({ workspaces, defaultWorkspaceId }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  
  // State for ticket types and selection
  const [type, setType] = useState("INCIDENT");
  const [selectedCategory, setSelectedCategory] = useState("ISSUE");
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);

  // Workspace and Submission state
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId || workspaces[0]?.id || "");
  const [approverId, setApproverId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [userRoleConfig, setUserRoleConfig] = useState<any>(null);
  const router = useRouter();

  const fetchTicketTypes = async (wsId: string) => {
    if (!wsId) return;
    setTypesLoading(true);
    try {
      const res = await fetch(`/api/ticket-types?workspaceId=${wsId}`);
      if (res.ok) {
        const data = await res.json();
        setTicketTypes(data);
        if (data.length > 0) {
          setType(data[0].label);
          setSelectedCategory(data[0].category);
        }
      }
    } catch (e) {
      console.error("Failed to fetch ticket types", e);
    } finally {
      setTypesLoading(false);
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const label = e.target.value;
    setType(label);
    
    // Find category for the selected label
    const selected = ticketTypes.find(t => t.label === label);
    if (selected) {
      setSelectedCategory(selected.category);
    } else {
      // Fallback for defaults if any
      const upper = label.toUpperCase();
      if (upper === "CHANGE") setSelectedCategory("CHANGE");
      else if (upper === "REQUEST") setSelectedCategory("REQUEST");
      else setSelectedCategory("ISSUE");
    }
  };

  const fetchRoleConfig = async () => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      const profileRes = await fetch("/api/user/profile");
      const profileData = await profileRes.json();
      if (profileData.professionalRole) {
        const config = data.find((r: any) => r.roleName === profileData.professionalRole);
        setUserRoleConfig(config);
      }
    } catch (e) {
      console.error("Failed to fetch user role config", e);
    }
  };

  useEffect(() => {
    fetchRoleConfig();
    if (workspaceId) fetchTicketTypes(workspaceId);
  }, [workspaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !workspaceId) {
      setError("Title and Workspace are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          description, 
          priority, 
          type, 
          category: selectedCategory, // Pass category for backend logic
          workspaceId, 
          approverId 
        }),
      });
      if (res.ok) {
        router.push(`/dashboard/tickets`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create ticket");
      }
    } catch (e: any) {
        setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (workspaces.length === 0) {
    return (
        <div className="text-center py-6 text-slate-500">
            You don't have access to any workspaces yet.
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ticket Title *</label>
            <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            placeholder="e.g. Broken link on homepage"
            />
        </div>

        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
        </div>

        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ticket Type</label>
            <select
              value={type}
              disabled={typesLoading}
              onChange={handleTypeChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white disabled:opacity-50"
            >
              {typesLoading ? (
                <option>Loading types...</option>
              ) : ticketTypes.length > 0 ? (
                ticketTypes.map((t: any) => (
                    <option key={t.id} value={t.label}>{t.label}</option>
                ))
              ) : userRoleConfig ? (
                <>
                    <option value="INCIDENT">{userRoleConfig.issueIcon} {userRoleConfig.issueLabel}</option>
                    <option value="REQUEST">{userRoleConfig.requestIcon} {userRoleConfig.requestLabel}</option>
                    <option value="CHANGE">{userRoleConfig.changeIcon} {userRoleConfig.changeLabel}</option>
                </>
              ) : (
                <>
                    <option value="INCIDENT">Incident</option>
                    <option value="REQUEST">Request</option>
                    <option value="CHANGE">Change</option>
                </>
              )}
            </select>
        </div>

        {!defaultWorkspaceId && (
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Workspace *</label>
                <select
                  value={workspaceId}
                  required
                  onChange={(e) => {
                    setWorkspaceId(e.target.value);
                    fetchTicketTypes(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                    <option value="" disabled>Select a Workspace</option>
                    {workspaces.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>
            </div>
        )}

        {(() => {
            const ws = workspaces.find((w: any) => w.id === workspaceId);
            // Dynamic check based on category
            if (selectedCategory === "CHANGE" && ws?.requiresChangeApproval) {
                return (
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Select Approver *</label>
                        <select
                           value={approverId}
                           required
                           onChange={(e) => setApproverId(e.target.value)}
                           className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                        >
                            <option value="" disabled>Choose an approver</option>
                            {ws.approvers?.map((a: any) => (
                                <option key={a.id} value={a.userId}>{a.user.name || a.user.email}</option>
                            ))}
                        </select>
                    </div>
                );
            }
            return null;
        })()}

        <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-y"
              placeholder="Describe the issue in detail..."
            />
        </div>
      </div>

      {(() => {
        const ws = workspaces.find((w: any) => w.id === workspaceId);
        const isApproverRequired = selectedCategory === "CHANGE" && ws?.requiresChangeApproval;
        const hasNoApprovers = (ws?.approvers?.length || 0) === 0;

        if (isApproverRequired && hasNoApprovers) {
          return (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-pulse">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-tighter mb-1">Approval Blocked</p>
                  <p className="text-[11px] text-amber-700 leading-normal">
                    This workspace requires <strong>Change Approvals</strong>, but no approvers (Clients) have been invited yet. 
                    Please add an approver in <strong>Workspace Settings</strong> before creating this ticket.
                  </p>
                </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || (() => {
            const ws = workspaces.find((w: any) => w.id === workspaceId);
            return (selectedCategory === "CHANGE" && ws?.requiresChangeApproval && (ws?.approvers?.length || 0) === 0);
          })()}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Save size={18} />
          {loading ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}
