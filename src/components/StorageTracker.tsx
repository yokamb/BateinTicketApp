"use client";

import { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";

interface StorageData {
  usedBytes: number;
  totalLimit: number;
  plan: string;
}

export default function StorageTracker() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/storage-usage")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const usedMB = Math.round(data.usedBytes / (1024 * 1024));
  const totalMB = Math.round(data.totalLimit / (1024 * 1024));
  const percentage = Math.min(100, Math.max(0, (usedMB / totalMB) * 100));

  return (
    <div className="px-4 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <HardDrive size={16} className="text-purple-400" />
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Storage Usage</span>
      </div>
      
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-500 rounded-full ${
            percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-amber-500" : "bg-gradient-to-r from-purple-500 to-indigo-500"
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-end">
        <div className="text-[10px] text-slate-400 font-medium">
          {usedMB} MB of {totalMB} MB used
        </div>
        <div className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">
          {data.plan}
        </div>
      </div>
    </div>
  );
}
