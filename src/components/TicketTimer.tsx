"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Clock, RotateCcw } from "lucide-react";

interface TicketTimerProps {
  ticketId: string;
  initialSeconds: number;
  timerStartedAt: string | null;
  onSync?: (seconds: number) => void;
}

export default function TicketTimer({ 
  ticketId, 
  initialSeconds, 
  timerStartedAt,
  onSync 
}: TicketTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(!!timerStartedAt);
  const [loading, setLoading] = useState(false);

  // Sync with server on mount if it's already running to get current elapsed
  useEffect(() => {
    if (timerStartedAt) {
      const start = new Date(timerStartedAt).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000);
      setSeconds(initialSeconds + elapsed);
      setIsRunning(true);
    }
  }, [timerStartedAt, initialSeconds]);

  // The actual timer interval
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Format seconds to HH:MM:SS
  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = async () => {
    setLoading(true);
    const action = isRunning ? "STOP" : "START";
    try {
      const res = await fetch(`/api/tickets/${ticketId}/timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, currentTotalSeconds: seconds }),
      });
      if (res.ok) {
        setIsRunning(!isRunning);
        if (onSync) onSync(seconds);
      }
    } catch (err) {
      console.error("Timer toggle error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-5 bg-white sketch-border shadow-sketch relative group transition-all hover:scale-[1.01]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
            <Clock size={14} className={isRunning ? "text-indigo-600 animate-pulse" : "text-[#aaa]"} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#aaa]">Time Tracker</span>
        </div>
        {isRunning && (
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">Active</span>
            </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className={`text-3xl font-black tabular-nums tracking-tighter ${isRunning ? "text-[#0d0d0d]" : "text-[#bbb]"}`}>
          {formatTime(seconds)}
        </div>

        <button 
          onClick={handleToggle}
          disabled={loading}
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] border-2 ${
            isRunning 
              ? "bg-[#111] text-white border-[#111] hover:bg-rose-500 hover:border-rose-500" 
              : "bg-white text-indigo-600 border-[#eee] hover:border-indigo-600"
          }`}
        >
          {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
        </button>
      </div>

      <div className="mt-2 h-1 bg-[#f5f5f5] rounded-full overflow-hidden">
         <div className={`h-full transition-all duration-1000 bg-indigo-500 ${isRunning ? "w-full animate-progress-glow" : "w-0 opacity-0"}`}></div>
      </div>
    </div>
  );
}
