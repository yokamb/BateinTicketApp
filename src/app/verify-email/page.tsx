"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

function VerifyEmailContent() {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9f9] p-6 text-[#0d0d0d] font-sans antialiased">
      <div className="mb-8">
        <Logo className="scale-110" />
      </div>

      <div className="w-full max-w-md p-8 bg-white rounded-2xl border border-[#e5e5e5] shadow-xl shadow-black/[0.03] text-center space-y-6">
        {status === "loading" && (
          <div className="py-4">
            <div className="w-10 h-10 border-3 border-[#0d0d0d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-[#0d0d0d]">Verifying your email...</h2>
            <p className="text-[#888] text-sm">Just a moment.</p>
          </div>
        )}
        {status === "success" && (
          <div className="py-4">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-[#0d0d0d]">Email Verified!</h2>
            <p className="text-[#666] text-sm">Redirecting you to login...</p>
          </div>
        )}
        {status === "error" && (
          <div className="py-4">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-[#0d0d0d]">Verification Failed</h2>
            <p className="text-red-500 text-sm font-medium">{message}</p>
            <Link href="/register" className="inline-block mt-6 px-6 py-2 bg-[#0d0d0d] hover:bg-[#333] text-white rounded-xl font-semibold transition-colors text-sm shadow-md">
              Register Again
            </Link>
          </div>
        )}
      </div>
      
      <p className="mt-8 text-[10px] text-[#bbb] font-medium tracking-wide">© 2026 Batein Software. All rights reserved.</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-[#ddd]">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
