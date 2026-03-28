"use client";

import { useState } from "react";
import { Plus, Users, Ticket, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClientWorkspaces({ initialWorkspaces }: { initialWorkspaces: any[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setName("");
        setIsSuccess(true);
        setTimeout(() => {
          setIsCreating(false);
          setIsSuccess(false);
          router.refresh();
        }, 1500);
      } else {
        setError(data.error || "Failed to create workspace");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Your Instances</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm text-xs"
        >
          <Plus size={14} />
          New Workspace
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 relative animate-fade-in-up">
            <h3 className="text-base font-bold text-slate-900 mb-3">Create New Workspace</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company / Customer Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  placeholder="Acme Corp"
                />
              </div>

              {error && (
                <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[11px] font-medium leading-tight">
                  {error}
                </div>
              )}

              {isSuccess && (
                <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-[11px] font-medium leading-tight">
                  Workspace created successfully! Refreshing...
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setError(null); }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isSuccess}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 text-xs"
                >
                  {loading ? "Creating..." : isSuccess ? "Done!" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialWorkspaces.map((workspace) => (
          <div key={workspace.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow transition-shadow group">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base font-bold text-slate-900 truncate pr-3 group-hover:text-purple-600 transition-colors">{workspace.name}</h3>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 text-sm font-bold">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="flex gap-3 mb-4">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Users size={14} />
                <span className="text-xs font-medium">{workspace._count.customers} Users</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Ticket size={14} />
                <span className="text-xs font-medium">{workspace._count.tickets} Tickets</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
              <Link
                href={`/dashboard/workspaces/${workspace.id}`}
                className="text-purple-600 group-hover:text-purple-700 font-bold transition-colors flex items-center gap-1 text-[11px] uppercase tracking-wide group-hover:translate-x-1 duration-200"
              >
                Manage <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}

        {initialWorkspaces.length === 0 && (
          <div className="col-span-full py-8 text-center bg-white rounded-xl border border-slate-200 border-dashed">
            <h3 className="text-sm font-medium text-slate-900 mt-2">No workspaces yet</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">Create your first customer instance to get started.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="text-purple-600 font-medium hover:text-purple-700 text-sm"
            >
              + Create Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
