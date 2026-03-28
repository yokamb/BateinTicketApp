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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9f9] p-6 text-[#0d0d0d] font-sans antialiased relative overflow-hidden">
      {/* Background blobs for vibrancy */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="mb-10 relative z-10">
        <Logo className="scale-125" />
      </div>

      <div className="w-full max-w-md p-10 bg-white rounded-[2.5rem] border border-[#e5e5e5] shadow-2xl shadow-black/5 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight mb-2">Welcome back</h1>
          <p className="text-[#666] text-base font-medium">Sign in to your <span className="text-indigo-600">Batein</span> account</p>
        </div>

        {verified && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm text-center font-bold">
            ✅ Email verified! You can now log in.
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-[#888] mb-2 uppercase tracking-widest">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 text-[#0d0d0d] placeholder-[#bbb] transition-all outline-none text-sm font-medium"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#888] mb-2 uppercase tracking-widest">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 text-[#0d0d0d] placeholder-[#bbb] transition-all outline-none text-sm font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-2xl hover:shadow-indigo-500/40 text-white rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-base shadow-xl shadow-indigo-500/20"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          
          <div className="relative my-8 flex items-center gap-4">
             <div className="flex-1 border-t border-[#eee]"></div>
             <span className="text-[10px] text-[#bbb] font-black uppercase tracking-[0.2em] whitespace-nowrap">Or continue with</span>
             <div className="flex-1 border-t border-[#eee]"></div>
          </div>

          <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full py-3.5 px-6 bg-white border-2 border-[#eee] hover:border-indigo-400 hover:bg-indigo-50/20 text-[#0d0d0d] rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
          </button>
        </form>
        
        <div className="mt-10 text-center text-xs text-[#666] font-medium">
          Don't have an account?{" "}
          <Link href="/register" className="text-indigo-600 hover:underline font-black transition-all">
            Create an account
          </Link>
        </div>
      </div>
      
      <p className="mt-12 text-[10px] text-[#bbb] font-black tracking-[0.2em] uppercase relative z-10">© 2026 Batein Software. All rights reserved.</p>
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
