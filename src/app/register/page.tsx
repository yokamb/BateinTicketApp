"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordStrengthIndicator, { validatePassword } from "@/components/PasswordStrengthIndicator";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"freelancer" | "company">("freelancer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, userType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setRegistered(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">

        {/* Success state — email sent */}
        {registered ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl">📬</div>
            <h2 className="text-xl font-bold text-white">Check your inbox!</h2>
            <p className="text-indigo-200 text-sm leading-relaxed">
              We sent a verification link to{" "}
              <span className="font-semibold text-white">{email}</span>.<br />
              Click it to activate your account, then log in.
            </p>
            <Link href="/login" className="inline-block mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors text-sm">
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Create Account</h1>
              <p className="text-indigo-200 text-sm">Start managing tickets and clients seamlessly.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Account Type */}
              <div className="grid grid-cols-2 gap-4 mb-2">
                <button type="button" onClick={() => setUserType("freelancer")}
                  className={`p-4 rounded-xl border ${userType === "freelancer" ? "bg-indigo-500/20 border-indigo-400 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"} flex flex-col items-center justify-center gap-2 transition-all`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="font-semibold text-sm">Freelancer</span>
                </button>
                <button type="button" onClick={() => setUserType("company")}
                  className={`p-4 rounded-xl border ${userType === "company" ? "bg-cyan-500/20 border-cyan-400 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"} flex flex-col items-center justify-center gap-2 transition-all`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span className="font-semibold text-sm">Company</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-2">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-white placeholder-white/30 transition-all outline-none"
                  placeholder="John Doe" />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-2">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-white placeholder-white/30 transition-all outline-none"
                  placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-2">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-white placeholder-white/30 transition-all outline-none"
                  placeholder="Min. 8 chars, letters & numbers" />
                <PasswordStrengthIndicator password={password} dark={true} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-indigo-200">
              Already have an account?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
