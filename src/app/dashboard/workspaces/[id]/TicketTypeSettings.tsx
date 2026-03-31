"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Settings2, Edit2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TicketTypeSettings({ workspaceId }: { workspaceId: string }) {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newRequiresApproval, setNewRequiresApproval] = useState(false);
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editRequiresApproval, setEditRequiresApproval] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ticket-types?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setTypes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [workspaceId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/ticket-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            workspaceId, 
            label: newLabel, 
            category: newRequiresApproval ? "CHANGE" : "ISSUE" 
        }),
      });
      if (res.ok) {
        setNewLabel("");
        setNewRequiresApproval(false);
        fetchTypes();
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editLabel.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/ticket-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            id: editingId, 
            label: editLabel, 
            category: editRequiresApproval ? "CHANGE" : "ISSUE" 
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchTypes();
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (t: any) => {
    if (t.category === "CHANGE" || t.label.toUpperCase() === "CHANGE") {
        alert("This represents a core workflow type and cannot be deleted.");
        return;
    }
    if (!confirm(`Are you sure you want to delete "${t.label}"?`)) return;
    try {
      const res = await fetch(`/api/ticket-types?id=${t.id}`, { method: "DELETE" });
      if (res.ok) fetchTypes();
    } catch (e) {
      console.error(e);
    }
  };

  const startEditing = (t: any) => {
    setEditingId(t.id);
    setEditLabel(t.label);
    setEditRequiresApproval(t.category === "CHANGE");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 size={20} className="text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ticket Types</h2>
      </div>
      
      <p className="text-xs text-slate-500 mb-4 italic leading-relaxed">
        Customize labels and categories for your tickets. All workspace members can manage these.
      </p>

      <div className="space-y-3 mb-6">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-slate-100 rounded-xl"></div>
            <div className="h-10 bg-slate-100 rounded-xl"></div>
          </div>
        ) : types.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center bg-slate-50/50">
              <Plus size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-900 mb-1">Clean Slate</p>
              <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                  No ticket labels defined yet. Add your first custom label below to start tracking work.
              </p>
          </div>
        ) : (
          types.map((t: any) => (
            <div key={t.id} className="group border border-transparent hover:border-slate-100 transition-all rounded-xl">
              {editingId === t.id ? (
                <form onSubmit={handleUpdate} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl animate-fade-in border border-indigo-100 ring-1 ring-indigo-50">
                   <input 
                      type="text" 
                      value={editLabel}
                      autoFocus
                      placeholder="Label name..."
                      onChange={e => setEditLabel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500 transition-all bg-white"
                   />
                   <label className="flex items-center gap-2 cursor-pointer p-1">
                      <input 
                        type="checkbox"
                        checked={editRequiresApproval}
                        onChange={e => setEditRequiresApproval(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Requires Client Approval</span>
                   </label>
                  
                  <div className="flex justify-end gap-1.5 mt-1">
                     <button type="button" onClick={() => setEditingId(null)} className="p-1 px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-200 rounded transition-colors flex items-center gap-1">
                        <X size={12} /> Cancel
                     </button>
                     <button type="submit" disabled={updating} className="p-1 px-2 text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded transition-colors flex items-center gap-1 shadow-sm">
                        <Check size={12} /> {updating ? "Saving..." : "Save Changes"}
                     </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl transition-all border border-transparent group-hover:bg-white group-hover:border-slate-200 group-hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">{t.label}</span>
                    {t.category === 'CHANGE' && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[9px] font-black uppercase tracking-widest border border-purple-100 flex items-center gap-1 transition-all duration-300 animate-fade-in">
                           <Check size={10} /> Approval Workflow
                        </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => startEditing(t)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(t)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="pt-4 border-t border-slate-100 space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Label</h3>
        <div className="space-y-3">
            <input 
              type="text" 
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. Bug Report, Client Work..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xs font-semibold transition-all shadow-sm"
            />
            
            <label className="flex items-center gap-2 cursor-pointer group/label">
                <input 
                  type="checkbox"
                  checked={newRequiresApproval}
                  onChange={e => setNewRequiresApproval(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 group-hover/label:text-indigo-600 transition-colors">Needs Client Approval?</span>
            </label>
        </div>
        
        <button 
          type="submit" 
          disabled={adding || !newLabel.trim()}
          className="w-full flex items-center justify-center gap-2 bg-[#0d0d0d] hover:bg-[#1a1a1a] text-white py-3 rounded-xl font-black text-xs transition-all disabled:opacity-50 shadow-xl shadow-slate-200 mt-2"
        >
          <Plus size={14} />
          {adding ? "Creating..." : "Add Label"}
        </button>
      </form>
    </div>
  );
}
