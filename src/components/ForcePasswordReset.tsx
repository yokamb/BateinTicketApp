"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Lock, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ForcePasswordReset() {
  const { data: session, update } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // If session doesn't require reset, hide
  if (!(session?.user as any)?.mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        // Force refresh session to clear the flag
        await update({ mustChangePassword: false });
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update password");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0d0d0d]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white font-sans overflow-y-auto">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-white/20 animate-pulse-subtle">
            <Lock className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase mb-2">Password Update Required</h1>
          <p className="text-sm text-slate-400 font-medium leading-relaxed px-4">
            For security reasons, you must set a permanent password before accessing your Batein workspace.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Must be at least 8 chars"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-fade-in shadow-xl shadow-red-500/5">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !newPassword}
            className="w-full py-4 bg-white text-[#0d0d0d] rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-2xl shadow-indigo-500/20 mt-4"
          >
            {loading ? "Updating..." : "Update & Access Dashboard"}
          </button>
        </form>

        {/* Branding */}
        <p className="mt-12 text-center text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] opacity-40">
          Powered by Batein Security
        </p>
      </div>
    </div>
  );
}
