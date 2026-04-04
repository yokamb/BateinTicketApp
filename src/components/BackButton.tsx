"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors group mb-4"
    >
      <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  );
}
