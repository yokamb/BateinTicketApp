"use client";

import { useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  Clock, Download, Filter, RefreshCw, TrendingUp,
  Ticket, FileText, Calendar, ArrowLeft, ChevronDown, ChevronUp
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtSec(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function fmtSecDecimal(s: number) {
  return (s / 3600).toFixed(2) + "h";
}

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return `${d.toLocaleDateString("en", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
}

function isoToday() {
  return new Date().toISOString().split("T")[0];
}
function isoOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const PRESETS = [
  { label: "This Week",  from: isoOffset(-6),  to: isoToday() },
  { label: "Last 2 Weeks", from: isoOffset(-13), to: isoToday() },
  { label: "This Month", from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0], to: isoToday() },
  { label: "Last 3 Months", from: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split("T")[0], to: isoToday() },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketSummary {
  ticket: {
    id: string; shortId: string; title: string;
    type: string; typeCategory: string; status: string;
    workspace: { id: string; name: string };
  };
  totalSeconds: number;
  entries: { id: string; seconds: number; note: string | null; isManual: boolean; createdAt: string }[];
}

interface ReportData {
  totalSeconds: number;
  logCount: number;
  ticketCount: number;
  ticketSummaries: TicketSummary[];
  dailyBreakdown: { date: string; seconds: number }[];
  weeklyBreakdown: { weekStart: string; seconds: number }[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimeReportsClient({ workspaces }: { workspaces: { id: string; name: string }[] }) {
  const router = useRouter();

  const [from, setFrom] = useState(isoOffset(-6));
  const [to, setTo] = useState(isoToday());
  const [workspaceId, setWorkspaceId] = useState("");
  const [chartMode, setChartMode] = useState<"daily" | "weekly">("daily");
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [hasRun, setHasRun] = useState(false);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setHasRun(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (workspaceId) params.set("workspaceId", workspaceId);
      const res = await fetch(`/api/reports/time?${params}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [from, to, workspaceId]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFrom(preset.from);
    setTo(preset.to);
  };

  const toggleTicket = (id: string) => {
    setExpandedTickets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!data) return;
    const rows: string[][] = [
      ["Ticket ID", "Ticket Title", "Workspace", "Type", "Status", "Date", "Hours", "Minutes", "Total Time (hrs)", "Note", "Entry Type"]
    ];
    for (const ts of data.ticketSummaries) {
      for (const entry of ts.entries) {
        const d = new Date(entry.createdAt);
        rows.push([
          ts.ticket.shortId,
          `"${ts.ticket.title.replace(/"/g, '""')}"`,
          ts.ticket.workspace.name,
          ts.ticket.type,
          ts.ticket.status,
          d.toLocaleDateString(),
          String(Math.floor(entry.seconds / 3600)),
          String(Math.floor((entry.seconds % 3600) / 60)),
          (entry.seconds / 3600).toFixed(2),
          `"${(entry.note || "").replace(/"/g, '""')}"`,
          entry.isManual ? "Manual" : "Timer"
        ]);
      }
    }
    // Summary footer
    rows.push([]);
    rows.push(["SUMMARY", "", "", "", "", "", "", "", "", "", ""]);
    rows.push(["Total Entries", String(data.logCount)]);
    rows.push(["Tickets Worked", String(data.ticketCount)]);
    rows.push(["Total Hours", (data.totalSeconds / 3600).toFixed(2)]);
    rows.push(["Report Period", `${from} to ${to}`]);

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time_report_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chart data prep
  const chartData = chartMode === "daily"
    ? (data?.dailyBreakdown || []).map(d => ({
        label: new Date(d.date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }),
        hours: parseFloat((d.seconds / 3600).toFixed(2)),
        date: d.date
      }))
    : (data?.weeklyBreakdown || []).map(d => ({
        label: getWeekLabel(d.weekStart),
        hours: parseFloat((d.seconds / 3600).toFixed(2)),
        date: d.weekStart
      }));

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in text-sm text-slate-900">

      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 mb-3 transition-colors group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> Back
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock size={20} className="text-indigo-600" />
              Time Reports
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Track hours worked across tickets and generate exportable reports.</p>
          </div>
          {data && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
          <Filter size={12} /> Filters
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                from === p.from && to === p.to
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Range + Workspace */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">From</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">To</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Workspace</label>
            <select
              value={workspaceId}
              onChange={e => setWorkspaceId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">All Workspaces</option>
              {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={fetchReport}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-60"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          <RefreshCw size={20} className="animate-spin mr-2" /> Loading report...
        </div>
      )}

      {!isLoading && hasRun && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                label: "Total Hours",
                value: fmtSecDecimal(data.totalSeconds),
                sub: fmtSec(data.totalSeconds) + " tracked",
                icon: <Clock size={18} />,
                color: "indigo"
              },
              {
                label: "Time Entries",
                value: String(data.logCount),
                sub: "individual sessions",
                icon: <FileText size={18} />,
                color: "violet"
              },
              {
                label: "Tickets Worked",
                value: String(data.ticketCount),
                sub: "unique tickets",
                icon: <Ticket size={18} />,
                color: "emerald"
              }
            ].map((kpi, i) => (
              <div key={i} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-3 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  kpi.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                  kpi.color === "violet" ? "bg-violet-50 text-violet-600" :
                  "bg-emerald-50 text-emerald-600"
                }`}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{kpi.label}</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</p>
                  <p className="text-[10px] text-slate-400">{kpi.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-800">Hours Worked</h2>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  {(["daily", "weekly"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setChartMode(m)}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                        chartMode === m ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                {chartMode === "daily" ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} unit="h" />
                    <Tooltip
                      formatter={(v: any) => [`${v}h`, "Hours"]}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} fill="url(#timeGrad)" />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} unit="h" />
                    <Tooltip
                      formatter={(v: any) => [`${v}h`, "Hours"]}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-Ticket Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Ticket size={15} className="text-indigo-500" />
                Ticket Breakdown
              </h2>
              <span className="text-[11px] text-slate-400 font-bold">{data.ticketSummaries.length} tickets</span>
            </div>

            {data.ticketSummaries.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No time logs in this period.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.ticketSummaries.map(ts => {
                  const isExpanded = expandedTickets.has(ts.ticket.id);
                  const pctOfTotal = data.totalSeconds > 0 ? (ts.totalSeconds / data.totalSeconds) * 100 : 0;

                  return (
                    <div key={ts.ticket.id}>
                      {/* Ticket Row */}
                      <button
                        onClick={() => toggleTicket(ts.ticket.id)}
                        className="w-full text-left px-4 sm:px-6 py-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[10px] font-black text-indigo-500 font-mono">{ts.ticket.shortId}</span>
                              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                {ts.ticket.status.replace("_", " ")}
                              </span>
                              <span className="text-[9px] text-slate-400">{ts.ticket.workspace.name}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-800 truncate">{ts.ticket.title}</p>
                            {/* Progress bar */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full transition-all"
                                  style={{ width: `${pctOfTotal}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-400 shrink-0">{pctOfTotal.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-black text-indigo-600">{fmtSecDecimal(ts.totalSeconds)}</p>
                              <p className="text-[10px] text-slate-400">{fmtSec(ts.totalSeconds)}</p>
                              <p className="text-[9px] text-slate-400">{ts.entries.length} {ts.entries.length === 1 ? "entry" : "entries"}</p>
                            </div>
                            {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Log Entries */}
                      {isExpanded && (
                        <div className="px-4 sm:px-6 pb-3 space-y-1.5 bg-slate-50/60">
                          {ts.entries.map(entry => (
                            <div
                              key={entry.id}
                              className="flex items-start justify-between gap-3 px-3 py-2 bg-white border border-slate-100 rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${entry.isManual ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"}`}>
                                    {entry.isManual ? "Manual" : "Timer"}
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    {new Date(entry.createdAt).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                                    {" "}
                                    {new Date(entry.createdAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                {entry.note && (
                                  <p className="text-[10px] text-slate-600 mt-0.5 italic">"{entry.note}"</p>
                                )}
                              </div>
                              <span className="text-xs font-black text-slate-700 shrink-0">{fmtSec(entry.seconds)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export reminder */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-indigo-800">Ready to share this report?</p>
              <p className="text-[10px] text-indigo-500 mt-0.5">
                Export to CSV — includes every time entry, ticket reference, date, note, and totals.
              </p>
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
            >
              <Download size={13} /> Download CSV
            </button>
          </div>
        </>
      )}

      {!isLoading && !hasRun && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <Calendar size={28} className="text-indigo-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-1">Choose a period and generate your report</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Select a date range above, optionally filter by workspace, then click <strong>Generate Report</strong>.
          </p>
        </div>
      )}

      {!isLoading && hasRun && data && data.logCount === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Clock size={28} className="text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-500">No time logs found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            No time was tracked in this period. Try expanding the date range or check a different workspace.
          </p>
        </div>
      )}
    </div>
  );
}
