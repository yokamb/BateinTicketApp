"use client";

import { useState, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  TrendingUp, Clock, BarChart2,
  SlidersHorizontal, RefreshCw, Zap, Repeat, AlertTriangle, ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#6366f1",
  IN_PROGRESS: "#f59e0b",
  RESOLVED: "#10b981",
  CLOSED: "#94a3b8"
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  URGENT: "#ef4444"
};
const CHART_PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#f97316", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

function formatSeconds(s: number) {
  if (!s) return "0m";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ChartCard({ title, children, types, activeType, onTypeChange }: {
  title: string;
  children: React.ReactNode;
  types?: string[];
  activeType?: string;
  onTypeChange?: (t: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        {types && onTypeChange && (
          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
            {types.map(t => (
              <button
                key={t}
                onClick={() => onTypeChange(t)}
                className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeType === t ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

interface Filters {
  workspaceId: string;
  status: string;
  priority: string;
  type: string;
  dateFrom: string;
  dateTo: string;
}

interface Stats {
  totalTickets: number;
  totalTimeWorked: number;
  recurringTicketCount: number;
  statusBreakdown: { status: string; count: number }[];
  priorityBreakdown: { priority: string; count: number }[];
  typeBreakdown: { type: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  trends: { date: string; count: number }[];
  timeLogTrend: { date: string; minutes: number }[];
  performance: { avgResolutionSeconds: number; avgTimeSpent: number };
  plan: string;
  workspaces: { id: string; name: string }[];
}

export default function AnalyticsClient({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    workspaceId: "", status: "", priority: "", type: "", dateFrom: "", dateTo: ""
  });

  const [trendChartType, setTrendChartType] = useState("Line");
  const [timeChartType, setTimeChartType] = useState("Area");
  const [typeChartType, setTypeChartType] = useState("Bar");
  const router = useRouter();

  const applyFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/analytics?${params.toString()}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const resetFilters = () => {
    setFilters({ workspaceId: "", status: "", priority: "", type: "", dateFrom: "", dateTo: "" });
  };

  // KPI cards data
  const kpis = [
    {
      label: "Total Tickets",
      value: stats.totalTickets,
      suffix: "",
      icon: <TrendingUp size={18} />,
      color: "indigo",
      bg: "bg-indigo-50 text-indigo-600"
    },
    {
      label: "Time Logged",
      value: formatSeconds(stats.totalTimeWorked),
      suffix: "",
      raw: true,
      icon: <Clock size={18} />,
      color: "emerald",
      bg: "bg-emerald-50 text-emerald-600"
    },
    {
      label: "Avg Resolution",
      value: Math.round(stats.performance.avgResolutionSeconds / 3600 * 10) / 10,
      suffix: "hrs",
      icon: <Zap size={18} />,
      color: "amber",
      bg: "bg-amber-50 text-amber-600"
    },
    {
      label: "Recurring",
      value: stats.recurringTicketCount,
      suffix: "tickets",
      icon: <Repeat size={18} />,
      color: "violet",
      bg: "bg-violet-50 text-violet-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors group mb-2"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> Back
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-600" />
            Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time ticket insights and performance data.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              showFilters ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <SlidersHorizontal size={13} /> Filters
          </button>
          <button
            onClick={applyFilters}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Query Filters</h3>
            <button onClick={resetFilters} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">
              Reset All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Workspace</label>
              <select
                value={filters.workspaceId}
                onChange={e => setFilters(f => ({ ...f, workspaceId: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">All</option>
                {stats.workspaces?.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Status</label>
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">All</option>
                {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Priority</label>
              <select
                value={filters.priority}
                onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">All</option>
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Type</label>
              <input
                type="text"
                value={filters.type}
                onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                placeholder="e.g. Incident"
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
          <button
            onClick={applyFilters}
            disabled={isLoading}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Apply Filters
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`p-2.5 rounded-xl ${kpi.bg} shrink-0`}>{kpi.icon}</div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums leading-tight">
                {typeof kpi.value === "number" ? kpi.value : kpi.value}
                {kpi.suffix && <span className="text-sm font-bold text-slate-400 ml-1">{kpi.suffix}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Ticket Volume Trend */}
        <ChartCard
          title="Ticket Volume (30 days)"
          types={["Line", "Bar", "Area"]}
          activeType={trendChartType}
          onTypeChange={setTrendChartType}
        >
          {stats.trends.length === 0 ? (
            <EmptyChart message="No trend data in selected range" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              {trendChartType === "Bar" ? (
                <BarChart data={stats.trends} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip labelFormatter={l => `Date: ${l}`} />
                  <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} name="Tickets" />
                </BarChart>
              ) : trendChartType === "Area" ? (
                <AreaChart data={stats.trends} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" name="Tickets" />
                </AreaChart>
              ) : (
                <LineChart data={stats.trends} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Tickets" />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Time Logged Trend */}
        <ChartCard
          title="Time Logged (mins/day)"
          types={["Area", "Bar", "Line"]}
          activeType={timeChartType}
          onTypeChange={setTimeChartType}
        >
          {stats.timeLogTrend.length === 0 ? (
            <EmptyChart message="No time logs in selected range" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              {timeChartType === "Bar" ? (
                <BarChart data={stats.timeLogTrend} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="#10b981" radius={[3, 3, 0, 0]} name="Minutes" />
                </BarChart>
              ) : timeChartType === "Line" ? (
                <LineChart data={stats.timeLogTrend} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="minutes" stroke="#10b981" strokeWidth={2.5} dot={false} name="Minutes" />
                </LineChart>
              ) : (
                <AreaChart data={stats.timeLogTrend} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <defs>
                    <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="minutes" stroke="#10b981" strokeWidth={2} fill="url(#timeGrad)" name="Minutes" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Status Donut */}
        <ChartCard title="Ticket Status Breakdown">
          {stats.statusBreakdown.length === 0 ? (
            <EmptyChart message="No data" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="count"
                    nameKey="status"
                    paddingAngle={3}
                  >
                    {stats.statusBreakdown.map((entry, i) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.statusBreakdown.map((d, i) => (
                  <div key={d.status} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[d.status] || CHART_PALETTE[i % CHART_PALETTE.length] }} />
                      <span className="text-[10px] font-bold text-slate-700 uppercase">{d.status.replace("_", " ")}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Priority Distribution */}
        <ChartCard title="Priority Distribution">
          {stats.priorityBreakdown.length === 0 ? (
            <EmptyChart message="No data" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.priorityBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="count"
                    nameKey="priority"
                    paddingAngle={3}
                  >
                    {stats.priorityBreakdown.map((entry, i) => (
                      <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.priorityBreakdown.map((d, i) => (
                  <div key={d.priority} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLORS[d.priority] || CHART_PALETTE[i % CHART_PALETTE.length] }} />
                      <span className="text-[10px] font-bold text-slate-700 uppercase">{d.priority}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Ticket Types Breakdown */}
        <ChartCard
          title="Top Ticket Types"
          types={["Bar", "Line"]}
          activeType={typeChartType}
          onTypeChange={setTypeChartType}
        >
          {stats.typeBreakdown.length === 0 ? (
            <EmptyChart message="No ticket type data" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              {typeChartType === "Line" ? (
                <LineChart data={stats.typeBreakdown} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="type" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip />
                  <Line dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} dot name="Count" />
                </LineChart>
              ) : (
                <BarChart data={stats.typeBreakdown} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                  <YAxis dataKey="type" type="category" tick={{ fontSize: 9 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Count">
                    {stats.typeBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Category Breakdown */}
        <ChartCard title="Category Breakdown (Issue / Request / Change)">
          {stats.categoryBreakdown.length === 0 ? (
            <EmptyChart message="No data" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.categoryBreakdown} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Count">
                  {stats.categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-center gap-2 bg-slate-50 rounded-xl border-2 border-dashed border-slate-100">
      <AlertTriangle size={18} className="text-slate-300" />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{message}</p>
    </div>
  );
}
