"use client";

import { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";

interface StorageData {
  usedBytes: number;
  totalLimit: number;
  plan: string;
  breakdown?: {
    attachmentBytes: number;
    ticketTextBytes: number;
    noteBytes: number;
  };
}

function fmt(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function StorageTracker() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/storage-usage")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const used = data.usedBytes ?? 0;
  const total = data.totalLimit ?? 1;
  const percentage = Math.min(100, Math.max(0, (used / total) * 100));
  const isNearLimit = percentage > 85;
  const isCritical = percentage > 95;

  return (
    <div className="px-4 py-4 bg-white border border-[#eceef0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isCritical ? "bg-red-50" : isNearLimit ? "bg-amber-50" : "bg-indigo-50"}`}>
            <HardDrive size={14} className={isCritical ? "text-red-500" : isNearLimit ? "text-amber-500" : "text-indigo-600"} />
          </div>
          <span className="text-[11px] font-bold text-[#1a1a1a] uppercase tracking-tight">Storage Usage</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isCritical ? "bg-red-100 text-red-700" : "bg-[#f0f2f4] text-[#475467]"
        }`}>
          {data.plan}
        </span>
      </div>
      
      <div className="h-2 w-full bg-[#f0f2f5] rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full transition-all duration-1000 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ${
            isCritical 
              ? "bg-gradient-to-r from-red-500 to-orange-500" 
              : isNearLimit 
                ? "bg-gradient-to-r from-amber-400 to-orange-400" 
                : "bg-gradient-to-r from-indigo-600 to-blue-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between items-end mb-3">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-[#1a1a1a]">{fmt(used)}</span>
          <span className="text-[10px] text-[#667085] font-medium">used of {fmt(total)}</span>
        </div>
        <span className={`text-[11px] font-heavy ${isCritical ? "text-red-600" : "text-[#1a1a1a]"}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>

      {data.breakdown && (
        <div className="mt-3 pt-3 border-t border-[#f2f4f7] space-y-1.5">
          {data.breakdown.attachmentBytes > 0 && (
            <div className="flex justify-between text-[10px] items-center">
              <span className="text-[#667085] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Attachments
              </span>
              <span className="text-[#344054] font-semibold">{fmt(data.breakdown.attachmentBytes)}</span>
            </div>
          )}
          {data.breakdown.noteBytes > 0 && (
            <div className="flex justify-between text-[10px] items-center">
              <span className="text-[#667085] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Notes
              </span>
              <span className="text-[#344054] font-semibold">{fmt(data.breakdown.noteBytes)}</span>
            </div>
          )}
          {data.breakdown.ticketTextBytes > 0 && (
            <div className="flex justify-between text-[10px] items-center">
              <span className="text-[#667085] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Tickets
              </span>
              <span className="text-[#344054] font-semibold">{fmt(data.breakdown.ticketTextBytes)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
