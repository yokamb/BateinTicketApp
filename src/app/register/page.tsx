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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-[#0d0d0d] font-sans antialiased relative overflow-hidden">
      {/* Absolute Base Layer: White Background */}
      <div className="fixed inset-0 z-[-2] bg-white"></div>
      
      {/* Absolute Middle Layer: Subtle Tech Pattern Background */}
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.08]"
        style={{ backgroundImage: "url('/bg-pattern.png')", backgroundRepeat: "repeat", backgroundSize: "400px" }}
      ></div>

      <div className="mb-12 relative z-10 hover:scale-105 transition-transform duration-500 cursor-pointer">
        <Logo className="scale-150" />
      </div>

      <div className="w-full max-w-[440px] p-10 bg-white sketch-border shadow-sketch relative z-10 transition-all">

        {/* Success state — email sent */}
        {registered ? (
          <div className="text-center space-y-8 py-6 transition-all animate-fade-in">
            <div className="text-7xl animate-bounce">📬</div>
            <div>
              <h2 className="text-4xl font-black text-[#0d0d0d] tracking-tighter italic mb-3">Check your inbox!</h2>
              <p className="text-[#666] text-sm leading-relaxed font-medium">
                We sent a verification link to<br />
                <span className="font-black text-indigo-600 underline underline-offset-4 decoration-indigo-100 decoration-4">{email}</span>.
              </p>
            </div>
            <Link href="/login" className="inline-block w-full py-4 bg-[#111] hover:bg-indigo-600 text-white rounded-xl font-black transition-all text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:scale-95">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black tracking-tighter mb-3 italic">Create Account</h1>
              <p className="text-[#666] text-sm font-medium tracking-tight">Join the <span className="text-indigo-600 font-bold underline decoration-indigo-100 decoration-4 underline-offset-4 tracking-normal">Batein</span> community</p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 border-2 border-red-500/20 text-red-600 text-xs text-center font-black uppercase tracking-widest rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="group">
                <label className="block text-[10px] font-black text-[#aaa] mb-2 uppercase tracking-[0.2em] group-focus-within:text-indigo-500 transition-colors">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-[#fcfcfc] border-2 border-[#eee] rounded-xl focus:border-indigo-500 text-[#0d0d0d] placeholder-[#ccc] transition-all outline-none text-sm font-bold shadow-sm"
                  placeholder="John Doe" />
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-[#aaa] mb-2 uppercase tracking-[0.2em] group-focus-within:text-indigo-500 transition-colors">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-[#fcfcfc] border-2 border-[#eee] rounded-xl focus:border-indigo-500 text-[#0d0d0d] placeholder-[#ccc] transition-all outline-none text-sm font-bold shadow-sm"
                  placeholder="you@example.com" />
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-[#aaa] mb-2 uppercase tracking-[0.2em] group-focus-within:text-indigo-500 transition-colors">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-[#fcfcfc] border-2 border-[#eee] rounded-xl focus:border-indigo-500 text-[#0d0d0d] placeholder-[#ccc] transition-all outline-none text-sm font-bold shadow-sm"
                  placeholder="Min. 8 characters" />
                <div className="pt-2">
                  <PasswordStrengthIndicator password={password} dark={false} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 px-6 bg-[#111] hover:bg-indigo-600 text-white rounded-xl font-black transition-all active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(79,70,229,0.3)] mt-4"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-12 text-center">
               <p className="text-[11px] text-[#888] font-bold tracking-tight mb-2 uppercase">Already registered?</p>
              <Link href="/login" className="inline-block py-2 px-6 border-2 border-[#eee] rounded-full text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 font-black transition-all text-xs uppercase tracking-widest">Sign In</Link>
            </div>
          </>
        )}
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 relative z-10">
        <div className="w-8 h-1 bg-purple-500 rounded-full opacity-20"></div>
        <p className="text-[10px] text-[#aaa] font-black tracking-[0.4em] uppercase">© 2026 Batein Software</p>
      </div>
    </div>
  );
}
