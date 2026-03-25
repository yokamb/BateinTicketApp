"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        if (res.redirected) {
          // Successful — redirect happened to /login?verified=1
          router.push("/login?verified=1");
        } else {
          const data = await res.json();
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
            <p className="text-indigo-200 text-sm">Just a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-6xl">✅</div>
            <h2 className="text-xl font-bold text-white">Email Verified!</h2>
            <p className="text-indigo-200 text-sm">Redirecting you to login...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-6xl">❌</div>
            <h2 className="text-xl font-bold text-white">Verification Failed</h2>
            <p className="text-red-300 text-sm">{message}</p>
            <Link href="/register" className="inline-block mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors text-sm">
              Register Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
