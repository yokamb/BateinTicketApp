"use client";

import { useState, useMemo } from "react";
import { 
  Plus, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  PieChart, 
  Zap,
  ChevronRight,
  TrendingDown,
  Target
} from "lucide-react";

export default function AnalyticsClient({ plan, stats }: { plan: string, stats: any }) {
  const isFree = plan === "FREE";

  const totalTimeHours = Math.round(stats.totalTimeWorked / 3600);
  const avgResolutionTime = stats.totalTickets > 0 ? (stats.totalTimeWorked / stats.totalTickets / 60).toFixed(1) : 0;

  // Render a simple SVG mini-line chart for the KPI card
  const MiniTrend = ({ color }: { color: string }) => (
    <svg viewBox="0 0 100 30" className="w-16 h-8 opacity-40 group-hover:opacity-100 transition-opacity">
       <path 
         d="M0 25 Q 25 5, 50 15 T 100 10" 
         fill="none" 
         stroke={color} 
         strokeWidth="3" 
         strokeLinecap="round"
       />
    </svg>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
       
       {/* KPI: Total Output */}
       <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.02)] group hover:scale-[1.03] transition-all hover:shadow-[15px_15px_0px_0px_rgba(99,102,241,0.05)]">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                <TrendingUp size={20} />
             </div>
             <MiniTrend color="#6366f1" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Lifetime Influx</p>
          <h2 className="text-4xl font-black text-[#111] tabular-nums tracking-tighter">{stats.totalTickets}</h2>
          <p className="mt-2 text-[11px] font-bold text-indigo-500 uppercase tracking-widest">+12.5% vs last month</p>
       </div>

       {/* KPI: Time Economy */}
       <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.02)] group hover:scale-[1.03] transition-all hover:shadow-[15px_15px_0px_0px_rgba(16,185,129,0.05)]">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                <Clock size={20} />
             </div>
             <MiniTrend color="#10b981" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Labor Transmission</p>
          <h2 className="text-4xl font-black text-[#111] tabular-nums tracking-tighter">{totalTimeHours}<span className="text-lg ml-1 opacity-20">hrs</span></h2>
          <p className="mt-2 text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Active workflow time</p>
       </div>

       {/* KPI: Resolution Speed */}
       <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.02)] group hover:scale-[1.03] transition-all hover:shadow-[15px_15px_0px_0px_rgba(245,158,11,0.05)]">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm">
                <Zap size={20} />
             </div>
             <MiniTrend color="#f59e0b" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Efficiency Vector</p>
          <h2 className="text-4xl font-black text-[#111] tabular-nums tracking-tighter">{avgResolutionTime}<span className="text-lg ml-1 opacity-20">m</span></h2>
          <p className="mt-2 text-[11px] font-bold text-amber-500 uppercase tracking-widest">Avg resolution speed</p>
       </div>

       {/* KPI: SLA Integrity */}
       <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.02)] group hover:scale-[1.03] transition-all hover:shadow-[15px_15px_0px_0px_rgba(99,102,241,0.05)]">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                <ShieldCheck size={20} />
             </div>
             <div className="w-16 h-8 flex items-end gap-1 px-1">
                <div className="w-2 h-4 bg-emerald-300 rounded-full"></div>
                <div className="w-2 h-6 bg-emerald-400 rounded-full"></div>
                <div className="w-2 h-3 bg-emerald-300 rounded-full"></div>
                <div className="w-2 h-8 bg-indigo-500 rounded-full animate-progress-glow"></div>
             </div>
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">SLA Promise</p>
          <h2 className="text-4xl font-black text-[#111] tabular-nums tracking-tighter">98.2<span className="text-lg ml-1 opacity-20">%</span></h2>
          <p className="mt-2 text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Success compliance</p>
       </div>

       {/* Charts Section */}
       <div className="lg:col-span-3 bg-white p-8 md:p-12 rounded-[3.5rem] border-2 border-slate-50 shadow-sm relative overflow-hidden group">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
             <div>
                <h3 className="text-lg font-black text-[#111] tracking-tight mb-1">Volume Modulation</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Flux intensity per solar cycle</p>
             </div>
             {!isFree && (
                 <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95">Solar (Weekly)</button>
                    <button className="px-4 py-1.5 bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-lg shadow-indigo-100">Lunar (Monthly)</button>
                 </div>
             )}
          </div>

          <div className="relative h-64 w-full">
             {isFree ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-[2px] rounded-[2rem] border-2 border-dashed border-slate-100 p-8 text-center group cursor-pointer hover:border-indigo-200 transition-all">
                  <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                     <TrendingUp className="text-indigo-500" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] mb-2">Historical trends Locked</h4>
                  <p className="text-xs font-bold text-slate-400 max-w-xs leading-relaxed uppercase tracking-tighter">Upgrade to PRO for lunar volume modulation and historical intensity mapping.</p>
               </div>
             ) : (
               <svg viewBox="0 0 1000 200" className="w-full h-full preserve-3d">
                  {/* Grid Lines */}
                  {[0, 50, 100, 150].map(y => (
                    <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#f0f0f0" strokeWidth="1" strokeDasharray="5,5" />
                  ))}
                  
                  {/* Area Chart Path */}
                  <path 
                    d="M0 200 L0 180 C 150 160, 250 190, 400 120 S 650 50, 750 100 S 900 30, 1000 60 L 1000 200 Z" 
                    fill="url(#gradient)" 
                    className="animate-in fade-in duration-1000 slide-in-from-bottom-20"
                  />
                  <path 
                    d="M0 180 C 150 160, 250 190, 400 120 S 650 50, 750 100 S 900 30, 1000 60" 
                    fill="none" 
                    stroke="#4338ca" 
                    strokeWidth="5" 
                    strokeLinecap="round"
                    className="animate-chart-trace"
                  />
                  
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4338ca" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#4338ca" stopOpacity="0" />
                    </linearGradient>
                  </defs>
               </svg>
             )}
          </div>
       </div>

       {/* Priority Distribution Donut */}
       <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border-2 border-slate-50 shadow-sm relative group overflow-hidden">
          <h3 className="text-lg font-black text-[#111] tracking-tight mb-8">Priority Cluster</h3>
          <div className="flex flex-col items-center">
             <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                   {/* Urgent Part */}
                   <circle 
                     cx="50" cy="50" r="40" 
                     fill="none" 
                     stroke="#ef4444" 
                     strokeWidth="12" 
                     strokeDasharray="251" 
                     strokeDashoffset="180" 
                     className="transition-all duration-1000"
                   />
                   {/* High Part */}
                   <circle 
                     cx="50" cy="50" r="40" 
                     fill="none" 
                     stroke="#f59e0b" 
                     strokeWidth="12" 
                     strokeDasharray="251" 
                     strokeDashoffset="120" 
                     className="transition-all duration-1000"
                   />
                   {/* Neutral Part */}
                   <circle 
                     cx="50" cy="50" r="40" 
                     fill="none" 
                     stroke="#4f46e5" 
                     strokeWidth="12" 
                     strokeDasharray="251" 
                     strokeDashoffset="60" 
                     className="transition-all duration-1000"
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <p className="text-3xl font-black text-[#111] leading-none mb-1">INTENSE</p>
                   <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Core Vector</p>
                </div>
             </div>

             <div className="mt-8 w-full space-y-3">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#111]">Neutral Flow</span>
                   </div>
                   <span className="text-xs font-black text-slate-400">45%</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#111]">High Impact</span>
                   </div>
                   <span className="text-xs font-black text-slate-400">30%</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#111]">Critical Urgent</span>
                   </div>
                   <span className="text-xs font-black text-slate-400">25%</span>
                </div>
             </div>
          </div>
       </div>

    </div>
  );
}
