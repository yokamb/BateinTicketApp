"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Settings2 } from "lucide-react";

export default function TicketTypeSettings({ workspaceId }: { workspaceId: string }) {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("ISSUE");
  const [adding, setAdding] = useState(false);

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
        body: JSON.stringify({ workspaceId, label: newLabel, category: newCategory }),
      });
      if (res.ok) {
        setNewLabel("");
        fetchTypes();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith("default-")) {
        alert("Cannot delete default types. Add a custom type to override.");
        return;
    }
    if (!confirm("Are you sure you want to delete this ticket type?")) return;
    try {
      const res = await fetch(`/api/ticket-types?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchTypes();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 size={20} className="text-slate-700" />
        <h2 className="text-xl font-bold text-slate-900">Ticket Types</h2>
      </div>
      
      <p className="text-xs text-slate-500 mb-4 italic">
        Manage how tickets are categorized and labeled in this workspace.
      </p>

      <div className="space-y-3 mb-6">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-slate-100 rounded-xl"></div>
            <div className="h-10 bg-slate-100 rounded-xl"></div>
          </div>
        ) : (
          types.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group border border-transparent hover:border-slate-200 transition-all">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                  t.category === 'ISSUE' ? 'bg-red-100 text-red-700' :
                  t.category === 'REQUEST' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {t.category}
                </span>
                <span className="text-sm font-semibold text-slate-900">{t.label}</span>
              </div>
              {!t.id.startsWith("default-") && (
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="pt-4 border-t border-slate-100 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Add New Type</h3>
        <div className="grid grid-cols-2 gap-2">
           <select 
             value={newCategory} 
             onChange={e => setNewCategory(e.target.value)}
             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-xs font-semibold"
           >
             <option value="ISSUE">ISSUE</option>
             <option value="REQUEST">REQUEST</option>
             <option value="CHANGE">CHANGE</option>
           </select>
           <input 
             type="text" 
             value={newLabel}
             onChange={e => setNewLabel(e.target.value)}
             placeholder="e.g. Bug Report"
             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
           />
        </div>
        <button 
          type="submit" 
          disabled={adding || !newLabel.trim()}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-bold text-xs transition-colors disabled:opacity-50"
        >
          <Plus size={14} />
          {adding ? "Adding..." : "Add Ticket Type"}
        </button>
      </form>
    </div>
  );
}
