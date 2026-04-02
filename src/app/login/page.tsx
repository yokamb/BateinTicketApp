"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "1";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError("An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] p-6 text-[#0d0d0d] font-sans antialiased relative overflow-hidden bg-dot-grid">
      {/* Abstract organic background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-50/50 organic-blob animate-cloud-morph pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-50/50 organic-blob animate-cloud-morph delay-2 pointer-events-none"></div>

      <div className="mb-12 relative z-10 hover:scale-105 transition-transform duration-500 cursor-pointer">
        <Logo className="scale-150" />
      </div>

      <div className="w-full max-w-[420px] p-10 bg-white sketch-border shadow-sketch relative z-10 transition-all hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.08)]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter mb-3 italic">Welcome back</h1>
          <p className="text-[#666] text-sm font-medium tracking-tight">Sign in to your <span className="text-indigo-600 font-bold underline decoration-indigo-200 decoration-4 underline-offset-4">Batein</span> account</p>
        </div>

        {verified && (
          <div className="mb-8 p-4 bg-emerald-50 border-2 border-emerald-500/20 text-emerald-700 text-xs text-center font-black uppercase tracking-widest rounded-xl">
            ✅ Email verified! Time to talk.
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-500/20 text-red-600 text-xs text-center font-black uppercase tracking-widest rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="group">
            <label className="block text-[10px] font-black text-[#aaa] mb-2 uppercase tracking-[0.2em] group-focus-within:text-indigo-500 transition-colors">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-[#fcfcfc] border-2 border-[#eee] rounded-xl focus:border-indigo-500 text-[#0d0d0d] placeholder-[#ccc] transition-all outline-none text-sm font-bold shadow-sm"
              placeholder="you@example.com"
            />
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-[#aaa] mb-2 uppercase tracking-[0.2em] group-focus-within:text-indigo-500 transition-colors">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-[#fcfcfc] border-2 border-[#eee] rounded-xl focus:border-indigo-500 text-[#0d0d0d] placeholder-[#ccc] transition-all outline-none text-sm font-bold shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-[#111] hover:bg-indigo-600 text-white rounded-xl font-black transition-all active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(79,70,229,0.3)] mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          
          <div className="relative my-10 flex items-center gap-4">
             <div className="flex-1 border-t-2 border-[#f0f0f0]"></div>
             <span className="text-[10px] text-[#bbb] font-black uppercase tracking-[0.3em] whitespace-nowrap">Auth via</span>
             <div className="flex-1 border-t-2 border-[#f0f0f0]"></div>
          </div>

          <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full py-4 px-6 bg-white border-2 border-[#eee] hover:border-[#111] text-[#111] rounded-xl font-black transition-all flex items-center justify-center gap-3 text-sm hover:bg-[#fcfcfc]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" fillOpacity="0.8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" fillOpacity="0.6" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" fillOpacity="0.4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google Account
          </button>
        </form>
        
        <div className="mt-12 text-center">
          <p className="text-[11px] text-[#888] font-bold tracking-tight mb-2 uppercase whitespace-nowrap overflow-hidden text-ellipsis">New to the community? Join below.</p>
          <Link href="/register" className="inline-block py-2 px-6 border-2 border-[#eee] rounded-full text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 font-black transition-all text-xs uppercase tracking-widest">
            Create an account
          </Link>
        </div>
      </div>
      
      <div className="mt-16 flex flex-col items-center gap-4 relative z-10">
        <div className="w-8 h-1 bg-indigo-500 rounded-full opacity-20"></div>
        <p className="text-[10px] text-[#aaa] font-black tracking-[0.4em] uppercase">© 2026 Batein Software</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-[#ddd]">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
