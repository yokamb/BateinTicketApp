"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordStrengthIndicator, { validatePassword } from "@/components/PasswordStrengthIndicator";
import Logo from "@/components/Logo";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9f9] p-6 text-[#0d0d0d] font-sans antialiased relative overflow-hidden">
      {/* Background blobs for vibrancy */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="mb-10 relative z-10">
        <Logo className="scale-125" />
      </div>

      <div className="w-full max-w-md p-10 bg-white rounded-[2.5rem] border border-[#e5e5e5] shadow-2xl shadow-black/5 relative z-10">

        {/* Success state — email sent */}
        {registered ? (
          <div className="text-center space-y-6 py-6 transition-all animate-in fade-in zoom-in duration-500">
            <div className="text-6xl animate-bounce">📬</div>
            <h2 className="text-3xl font-black text-[#0d0d0d] tracking-tight">Check your inbox!</h2>
            <p className="text-[#666] text-base leading-relaxed font-medium">
              We sent a verification link to{" "}
              <span className="font-black text-indigo-600">{email}</span>.<br />
              Click it to activate your account.
            </p>
            <Link href="/login" className="inline-block mt-8 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-2xl hover:shadow-indigo-500/40 text-white rounded-2xl font-black transition-all text-base shadow-xl shadow-indigo-500/20 active:scale-95">
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black tracking-tight mb-2">Create Account</h1>
              <p className="text-[#666] text-base font-medium">Join the <span className="text-indigo-600 font-black">Batein</span> community</p>
            </div>

            {error && (
              <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm text-center font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Account Type */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button type="button" onClick={() => setUserType("freelancer")}
                  className={`py-4 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all outline-none ${userType === "freelancer" ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg shadow-indigo-500/10" : "bg-[#fcfcfc] border-[#eee] text-[#888] hover:border-indigo-200"}`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="font-black text-xs uppercase tracking-widest">Freelancer</span>
                </button>
                <button type="button" onClick={() => setUserType("company")}
                  className={`py-4 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all outline-none ${userType === "company" ? "bg-purple-50 border-purple-500 text-purple-700 shadow-lg shadow-purple-500/10" : "bg-[#fcfcfc] border-[#eee] text-[#888] hover:border-purple-200"}`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span className="font-black text-xs uppercase tracking-widest">Company</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-black text-[#888] mb-2 uppercase tracking-widest">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 text-[#0d0d0d] placeholder-[#bbb] transition-all outline-none text-sm font-medium"
                  placeholder="John Doe" />
              </div>

              <div>
                <label className="block text-xs font-black text-[#888] mb-2 uppercase tracking-widest">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 text-[#0d0d0d] placeholder-[#bbb] transition-all outline-none text-sm font-medium"
                  placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-xs font-black text-[#888] mb-2 uppercase tracking-widest">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 text-[#0d0d0d] placeholder-[#bbb] transition-all outline-none text-sm font-medium"
                  placeholder="Min. 8 chars" />
                <PasswordStrengthIndicator password={password} dark={false} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-2xl hover:shadow-indigo-500/40 text-white rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-base shadow-xl shadow-indigo-500/20 mt-4"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-10 text-center text-xs text-[#666] font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 hover:underline font-black transition-all">Sign In</Link>
            </div>
          </>
        )}
      </div>

      <p className="mt-12 text-[10px] text-[#bbb] font-black tracking-[0.2em] uppercase relative z-10">© 2026 Batein Software. All rights reserved.</p>
    </div>
  );
}
