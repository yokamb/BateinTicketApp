"use client";

import { useState } from "react";
import { Plus, Users, Ticket, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClientWorkspaces({ initialWorkspaces }: { initialWorkspaces: any[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setName("");
        setIsCreating(false);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Your Instances</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          New Workspace
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Create New Workspace</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company / Customer Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Acme Corp"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialWorkspaces.map((workspace) => (
          <div key={workspace.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-slate-900 truncate pr-4">{workspace.name}</h3>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-2 text-slate-500">
                <Users size={16} />
                <span className="text-sm font-medium">{workspace._count.customers} Users</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Ticket size={16} />
                <span className="text-sm font-medium">{workspace._count.tickets} Tickets</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400">Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
              <Link
                href={`/dashboard/workspaces/${workspace.id}`}
                className="text-purple-600 group-hover:text-purple-700 p-2 rounded-full group-hover:bg-purple-50 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                Manage <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}

        {initialWorkspaces.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <h3 className="text-lg font-medium text-slate-900 mt-4">No workspaces yet</h3>
            <p className="text-slate-500 mt-1 mb-4">Create your first customer instance to get started.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="text-purple-600 font-medium hover:text-purple-700"
            >
              + Create Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
