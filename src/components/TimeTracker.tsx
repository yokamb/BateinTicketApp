"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Square, Clock, Plus, Edit3, ChevronDown, ChevronUp, Trash2, Check, X } from "lucide-react";

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatSecondsShort(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

interface TimeLog {
  id: string;
  seconds: number;
  note: string | null;
  isManual: boolean;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

interface Props {
  ticketId: string;
  totalTimeSpent: number;
}

export default function TimeTracker({ ticketId, totalTimeSpent: initialTotal }: Props) {
  const [mode, setMode] = useState<"timer" | "manual">("timer");
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [totalTime, setTotalTime] = useState(initialTotal || 0);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Manual entry state
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(0);
  const [manualNote, setManualNote] = useState("");
  
  // Editing state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editNote, setEditNote] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/time`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleStart = () => {
    startTimeRef.current = Date.now() - elapsed * 1000;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const handlePause = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleStop = async () => {
    handlePause();
    if (elapsed === 0) return;
    await logTime(elapsed, null, false);
    setElapsed(0);
  };

  const logTime = async (seconds: number, note: string | null, isManual: boolean) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds, note, isManual })
      });
      if (res.ok) {
        setTotalTime(prev => prev + seconds);
        await fetchLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const seconds = manualHours * 3600 + manualMinutes * 60;
    if (seconds <= 0) return;
    await logTime(seconds, manualNote || null, true);
    setManualHours(0);
    setManualMinutes(0);
    setManualNote("");
  };

  const handleEditStart = (log: TimeLog) => {
    setEditingLogId(log.id);
    setEditHours(Math.floor(log.seconds / 3600));
    setEditMinutes(Math.floor((log.seconds % 3600) / 60));
    setEditNote(log.note || "");
  };

  const handleEditSave = async (id: string, oldSeconds: number) => {
    const newSeconds = editHours * 3600 + editMinutes * 60;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/time-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds: newSeconds, note: editNote })
      });
      if (res.ok) {
        const diff = newSeconds - oldSeconds;
        setTotalTime(prev => prev + diff);
        setEditingLogId(null);
        await fetchLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, seconds: number) => {
    if (!confirm("Are you sure you want to delete this time log?")) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/time-logs/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTotalTime(prev => prev - seconds);
        await fetchLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-indigo-500" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Time Tracker</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total:</span>
          <span className="text-xs font-black text-indigo-600 tabular-nums">{formatSecondsShort(totalTime)}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode Toggle */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 w-fit">
          <button
            onClick={() => setMode("timer")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === "timer" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Play size={12} /> Stopwatch
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === "manual" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Edit3 size={12} /> Manual
          </button>
        </div>

        {/* Timer Mode */}
        {mode === "timer" && (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center">
              <span className={`text-2xl font-black tabular-nums tracking-tighter ${isRunning ? "text-indigo-600 animate-pulse" : "text-slate-700"}`}>
                {formatSeconds(elapsed)}
              </span>
            </div>
            <div className="flex gap-1.5">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="w-9 h-9 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm"
                  title="Start"
                >
                  <Play size={16} fill="white" />
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="w-9 h-9 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-sm"
                  title="Pause"
                >
                  <Pause size={16} fill="white" />
                </button>
              )}
              <button
                onClick={handleStop}
                disabled={elapsed === 0 || isSaving}
                className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-40"
                title="Stop & Save"
              >
                <Square size={14} fill="white" />
              </button>
            </div>
            {isSaving && <span className="text-[10px] text-slate-400 animate-pulse">Saving...</span>}
          </div>
        )}

        {/* Manual Mode */}
        {mode === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Hours</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={manualHours}
                  onChange={e => setManualHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Minutes</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={manualMinutes}
                  onChange={e => setManualMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Note (optional)</label>
              <input
                type="text"
                value={manualNote}
                onChange={e => setManualNote(e.target.value)}
                placeholder="What did you work on?"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving || (manualHours === 0 && manualMinutes === 0)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus size={12} />
              {isSaving ? "Adding..." : "Log Time"}
            </button>
          </form>
        )}

        {/* Log History Toggle */}
        <button
          onClick={() => setLogsOpen(o => !o)}
          className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors w-full pt-2 border-t border-slate-100"
        >
          {logsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Time Logs ({logs.length})
        </button>

        {/* Log History */}
        {logsOpen && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {isLoading && <p className="text-[10px] text-slate-400 italic text-center py-2">Loading...</p>}
            {!isLoading && logs.length === 0 && (
              <p className="text-[10px] text-slate-400 italic">No time logged yet.</p>
            )}
            {logs.map((log) => (
              <div key={log.id} className="group/log flex flex-col gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                {editingLogId === log.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          min={0}
                          value={editHours}
                          onChange={e => setEditHours(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold outline-none"
                          placeholder="Hrs"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={editMinutes}
                          onChange={e => setEditMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold outline-none"
                          placeholder="Min"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      placeholder="Note"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingLogId(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={() => handleEditSave(log.id, log.seconds)}
                        disabled={isSaving}
                        className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[9px] shrink-0">
                        {log.user.name?.[0] || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{log.user.name}</p>
                        {log.note && <p className="text-[10px] text-slate-500 italic truncate">{log.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-black text-indigo-600">{formatSecondsShort(log.seconds)}</p>
                        <p className="text-[9px] text-slate-400">{log.isManual ? "Manual" : "Timer"}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover/log:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditStart(log)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id, log.seconds)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
