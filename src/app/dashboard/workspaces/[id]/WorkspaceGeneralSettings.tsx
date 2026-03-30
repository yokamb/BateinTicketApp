"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, Check } from "lucide-react";

export default function WorkspaceGeneralSettings({ workspace }: { workspace: any }) {
  const [name, setName] = useState(workspace.name);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update workspace name");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
        <Settings size={20} className="text-slate-600" />
        Workspace Details
      </h2>
      
      <form onSubmit={handleUpdateName} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
            Workspace Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
              placeholder="Workspace Name"
            />
            <button
              type="submit"
              disabled={loading || name === workspace.name}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm ${
                saved 
                ? "bg-emerald-500 text-white" 
                : "bg-[#0d0d0d] text-white hover:bg-[#1a1a1a] disabled:opacity-50"
              }`}
            >
              {loading ? "..." : saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
