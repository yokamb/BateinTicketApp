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
    <div className="px-3 py-3 bg-[#efefef] border border-[#e0e0e0] rounded-xl">
      <div className="flex items-center gap-2 mb-2.5">
        <HardDrive size={13} className={isCritical ? "text-red-500" : isNearLimit ? "text-amber-500" : "text-[#888]"} />
        <span className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">Storage</span>
      </div>
      
      <div className="h-1 w-full bg-[#d5d5d5] rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-700 rounded-full ${
            isCritical ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-[#0d0d0d]"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[#888]">{fmt(used)} / {fmt(total)}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
          isCritical ? "bg-red-100 text-red-600" : "bg-[#e0e0e0] text-[#555]"
        }`}>
          {data.plan}
        </span>
      </div>

      {data.breakdown && (
        <div className="mt-2 pt-2 border-t border-[#e0e0e0] space-y-0.5">
          {data.breakdown.attachmentBytes > 0 && (
            <div className="flex justify-between text-[9px] text-[#999]">
              <span>Files</span><span>{fmt(data.breakdown.attachmentBytes)}</span>
            </div>
          )}
          {data.breakdown.noteBytes > 0 && (
            <div className="flex justify-between text-[9px] text-[#999]">
              <span>Notes</span><span>{fmt(data.breakdown.noteBytes)}</span>
            </div>
          )}
          {data.breakdown.ticketTextBytes > 0 && (
            <div className="flex justify-between text-[9px] text-[#999]">
              <span>Tickets</span><span>{fmt(data.breakdown.ticketTextBytes)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
