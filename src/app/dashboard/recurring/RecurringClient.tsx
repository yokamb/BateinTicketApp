"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Repeat, Plus, Play, Pause, Trash2, Clock, RefreshCw,
  Calendar, ChevronRight, Settings2, Zap, ArrowLeft, Globe, X, Sparkles
} from "lucide-react";
import { format, toZonedTime } from "date-fns-tz";


const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FREQUENCIES = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-Weekly" },
  { value: "MONTHLY", label: "Monthly" }
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function frequencyBadge(freq: string) {
  const map: Record<string, { label: string; color: string }> = {
    DAILY: { label: "Daily", color: "bg-violet-100 text-violet-700" },
    WEEKLY: { label: "Weekly", color: "bg-blue-100 text-blue-700" },
    BIWEEKLY: { label: "Bi-Weekly", color: "bg-cyan-100 text-cyan-700" },
    MONTHLY: { label: "Monthly", color: "bg-amber-100 text-amber-700" }
  };
  return map[freq] || { label: freq, color: "bg-slate-100 text-slate-600" };
}

function formatTime(h: number, m: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

interface Template {
  id: string;
  title: string;
  description: string;
  type: string;
  typeCategory: string;
  priority: string;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  timeHour: number;
  timeMinute: number;
  isActive: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
  workspace: { id: string; name: string };
}

interface Props {
  initialTemplates: Template[];
  workspaces: { id: string; name: string }[];
  ticketTypes: { id: string; label: string; category: string; workspaceId: string }[];
  currentUserId: string;
  userTimezone: string;
  onUpdateUser?: (data: any) => void;
}

const defaultForm = {
  workspaceId: "",
  title: "",
  description: "",
  type: "",
  typeCategory: "ISSUE",
  priority: "MEDIUM",
  frequency: "WEEKLY",
  dayOfWeek: 1,
  dayOfMonth: 1,
  timeHour: 9,
  timeMinute: 0
};

export default function RecurringClient({ initialTemplates, workspaces, ticketTypes, userTimezone }: Props) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...defaultForm, workspaceId: workspaces[0]?.id || "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [tzMismatch, setTzMismatch] = useState<string | null>(null);
  const [isUpdatingTz, setIsUpdatingTz] = useState(false);
  const router = useRouter();

  // Detect timezone mismatch
  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (userTimezone !== browserTz) {
      setTzMismatch(browserTz);
    } else {
      setTzMismatch(null);
    }
  }, [userTimezone]);

  const availableTypes = ticketTypes.filter(t => t.workspaceId === form.workspaceId);

  const handleFormChange = (field: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      
      // If workspace changes, reset ticket type to first available in new workspace
      if (field === "workspaceId") {
        const nextTypes = ticketTypes.filter(t => t.workspaceId === value);
        if (nextTypes.length > 0) {
          next.type = nextTypes[0].label;
          next.typeCategory = nextTypes[0].category;
        } else {
          next.type = "";
          next.typeCategory = "ISSUE";
        }
      }
      return next;
    });
  };

  const openCreate = () => {
    setForm({ ...defaultForm, workspaceId: workspaces[0]?.id || "" });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (t: Template) => {
    setForm({
      workspaceId: t.workspace.id,
      title: t.title,
      description: t.description,
      type: t.type,
      typeCategory: t.typeCategory,
      priority: t.priority,
      frequency: t.frequency,
      dayOfWeek: t.dayOfWeek ?? 1,
      dayOfMonth: t.dayOfMonth ?? 1,
      timeHour: t.timeHour,
      timeMinute: t.timeMinute
    });
    setEditingId(t.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.type || !form.workspaceId) return;
    setIsSaving(true);
    try {
      const url = editingId ? `/api/recurring/${editingId}` : "/api/recurring";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        if (editingId) {
          setTemplates(prev => prev.map(t => t.id === editingId ? data.template : t));
        } else {
          setTemplates(prev => [data.template, ...prev]);
        }
        setShowModal(false);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive })
    });
    if (res.ok) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive: !isActive } : t));
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this recurring template?")) return;
    const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    if (res.ok) setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const triggerNow = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/recurring/trigger", { 
        method: "POST",
        headers: { "referer": window.location.href }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.triggered} ticket(s) created from due templates.`);
        router.refresh();
      } else {
        alert(`❌ Error: ${data.error || "Failed to trigger"}`);
      }
    } catch (e) {
      alert("❌ Failed to connect to trigger API");
    } finally {
      setIsTriggering(false);
    }
  };

  const handleFixTimezone = async () => {
    if (!tzMismatch) return;
    setIsUpdatingTz(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: tzMismatch })
      });
      if (res.ok) {
        alert(`✅ Timezone updated to ${tzMismatch}. Refreshing schedules...`);
        window.location.reload(); 
      } else {
        alert("❌ Failed to update timezone");
      }
    } catch (e) {
      alert("❌ Network error updating timezone");
    } finally {
      setIsUpdatingTz(false);
    }
  };

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showModal]);

  return (
    <>
      <div className="space-y-6 animate-fade-in text-sm relative z-10">
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
              <Repeat size={20} className="text-violet-600" />
              Recurring Tickets
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Automatically create tickets on a recurring schedule.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={triggerNow}
              disabled={isTriggering}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-lg border border-slate-200 transition-all flex items-center gap-2 group disabled:opacity-50"
            >
              <Zap size={15} className={`group-hover:text-amber-500 transition-colors ${isTriggering ? "animate-pulse" : ""}`} />
              Run Due Jobs
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg border border-indigo-700 shadow-sm transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} /> New Template
            </button>
          </div>
        </div>

        {/* Timezone Mismatch Banner */}
        {tzMismatch && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                <Globe size={24} />
              </div>
              <div className="space-y-0.5 text-center md:text-left">
                <p className="text-sm font-bold text-amber-900 tracking-tight">Timezone Mismatch Detected</p>
                <p className="text-xs text-amber-700 font-medium max-w-md">
                  Your profile is set to <span className="font-bold underline decoration-amber-300 underline-offset-2">{userTimezone}</span>, but your browser is in <span className="font-bold underline decoration-amber-300 underline-offset-2">{tzMismatch}</span>. Your schedules trigger based on your profile zone.
                </p>
              </div>
            </div>
            <button
              onClick={handleFixTimezone}
              disabled={isUpdatingTz}
              className="w-full md:w-auto whitespace-nowrap px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.97] shadow-md shadow-amber-200 disabled:opacity-50"
            >
              {isUpdatingTz ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Zap size={14} className="fill-current" />
              )}
              Sync to {tzMismatch}
            </button>
          </div>
        )}

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
              <Repeat size={24} className="text-violet-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">No recurring templates yet</h3>
            <p className="text-xs text-slate-400 mb-5 max-w-xs">Set up automatic ticket creation for your team's repeating work.</p>
            <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm">
              <Plus size={14} /> Create First Template
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {templates.map(t => {
              const { label, color } = frequencyBadge(t.frequency);
              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-xl border ${t.isActive ? "border-slate-200" : "border-slate-100 opacity-60"} shadow-sm p-4 flex flex-wrap items-start gap-4 transition-all hover:shadow-md`}
                >
                  {/* Left */}
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                      {!t.isActive && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Paused</span>
                      )}
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-1">{t.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><Settings2 size={10} /> <strong>{t.type}</strong> · {t.typeCategory}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {formatTime(t.timeHour, t.timeMinute)}</span>
                      {t.frequency === "WEEKLY" || t.frequency === "BIWEEKLY" ? (
                        <span className="flex items-center gap-1"><Calendar size={10} /> {DAYS_OF_WEEK[t.dayOfWeek ?? 1]}</span>
                      ) : t.frequency === "MONTHLY" ? (
                        <span className="flex items-center gap-1"><Calendar size={10} /> Day {t.dayOfMonth} of month</span>
                      ) : null}
                      <span className="flex items-center gap-1 text-indigo-500 font-bold">
                        <RefreshCw size={10} /> Next: {format(toZonedTime(new Date(t.nextRunAt), userTimezone), "MMM d, yyyy h:mm a", { timeZone: userTimezone })}
                      </span>
                      {t.lastRunAt && (
                        <span>Last ran: {format(toZonedTime(new Date(t.lastRunAt), userTimezone), "MMM d, yyyy h:mm a", { timeZone: userTimezone })}</span>
                      )}
                    </div>
                  </div>

                  {/* Priority badge */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      t.priority === "URGENT" ? "bg-red-100 text-red-700" :
                      t.priority === "HIGH" ? "bg-orange-100 text-orange-700" :
                      t.priority === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{t.priority}</span>
                  </div>

                  {/* Workspace */}
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">{t.workspace.name}</span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => toggleActive(t.id, t.isActive)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-xs ${
                        t.isActive
                          ? "bg-amber-50 hover:bg-amber-100 text-amber-600"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                      }`}
                      title={t.isActive ? "Pause" : "Resume"}
                    >
                      {t.isActive ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                    <button
                      onClick={() => openEdit(t)}
                      className="w-7 h-7 flex items-center justify-center bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <ChevronRight size={13} />
                    </button>
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      className="w-7 h-7 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Centered Modal Overlay */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 pointer-events-none"
        >
          {/* Backdrop (clickable) */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity animate-in fade-in duration-500"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Content */}
          <div 
            className={`relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-auto transform transition-all duration-300 ${
              showModal ? "scale-100 opacity-100" : "scale-95 opacity-0 invisible"
            }`}
          >
            <div className="h-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Repeat size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {editingId ? "Edit Recurring Template" : "Create New Template"}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <Globe size={11} className="text-slate-400" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Timezone: {userTimezone}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-3 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-600 active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left Column: Core Info (Full width on mobile, 7/12 on large) */}
                  <div className="lg:col-span-7 space-y-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest flex items-center gap-2">
                           <Settings2 size={13} className="text-indigo-500" /> Title & Details
                        </label>
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={form.title}
                            onChange={e => handleFormChange("title", e.target.value)}
                            placeholder="e.g. Weekly Security Audit Report"
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                          />
                          <textarea
                            value={form.description}
                            onChange={e => handleFormChange("description", e.target.value)}
                            rows={4}
                            placeholder="Provide details about this task. This will be included in every generated ticket."
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white resize-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-5 rounded-2.5xl border border-slate-100 shadow-sm">
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2.5 tracking-widest">Target Workspace</label>
                          <select
                            value={form.workspaceId}
                            onChange={e => handleFormChange("workspaceId", e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-1.5xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all cursor-pointer"
                          >
                            {workspaces.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2.5 tracking-widest text-[#666]">Priority Style</label>
                          <div className="grid grid-cols-2 gap-2">
                            {PRIORITIES.map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => handleFormChange("priority", p)}
                                className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border-2 ${
                                  form.priority === p
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#f8faff] p-6 rounded-[2rem] border border-indigo-100 shadow-inner">
                        <label className="block text-[10px] font-black uppercase text-indigo-400 mb-3 tracking-widest">Primary Ticket Type</label>
                        <div className="flex flex-wrap gap-2">
                          {availableTypes.length > 0 ? (
                            availableTypes.map(t => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  handleFormChange("type", t.label);
                                  handleFormChange("typeCategory", t.category);
                                }}
                                className={`px-4 py-2.5 rounded-1.5xl text-[11px] font-black uppercase tracking-wider transition-all border-2 ${
                                  form.type === t.label
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                    : "bg-white text-slate-600 border-slate-100 hover:border-slate-300"
                                }`}
                              >
                                {t.label}
                              </button>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-xs px-2">No types available in this workspace</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Execution Rules (5/12) */}
                  <div className="lg:col-span-5 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                         <Calendar size={13} className="text-violet-500" /> Execution Rules
                      </label>
                      
                      <div className="space-y-6">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-500 mb-3 px-1 uppercase tracking-wider">How often?</span>
                          <div className="grid grid-cols-2 gap-3">
                            {FREQUENCIES.map(f => (
                              <button
                                key={f.value}
                                type="button"
                                onClick={() => handleFormChange("frequency", f.value)}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                                  form.frequency === f.value
                                    ? "bg-white text-indigo-600 border-indigo-600 shadow-lg scale-[1.03]"
                                    : "bg-white/50 text-slate-500 border-transparent hover:border-slate-200"
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Frequency Modifiers */}
                        {(form.frequency === "WEEKLY" || form.frequency === "BIWEEKLY") && (
                          <div className="animate-in slide-in-from-top-2 duration-300">
                             <span className="block text-[10px] font-bold text-slate-500 mb-3 px-1 uppercase tracking-wider">On which day?</span>
                             <div className="grid grid-cols-4 gap-2">
                               {DAYS_OF_WEEK.map((day, idx) => (
                                 <button
                                   key={idx}
                                   type="button"
                                   onClick={() => handleFormChange("dayOfWeek", idx)}
                                   className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                                     form.dayOfWeek === idx
                                       ? "bg-violet-600 text-white border-violet-600 shadow-md"
                                       : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                                   }`}
                                 >
                                   {day.slice(0, 3)}
                                 </button>
                               ))}
                             </div>
                          </div>
                        )}

                        {form.frequency === "MONTHLY" && (
                          <div className="animate-in slide-in-from-top-2 duration-300">
                             <span className="block text-[10px] font-bold text-slate-500 mb-3 px-1 uppercase tracking-wider">Which day of month?</span>
                             <div className="flex items-center gap-3">
                               <input
                                 type="number"
                                 min={1}
                                 max={28}
                                 value={form.dayOfMonth}
                                 onChange={e => handleFormChange("dayOfMonth", parseInt(e.target.value))}
                                 className="w-1/2 px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-800 focus:border-indigo-400 outline-none"
                               />
                               <span className="text-xs font-bold text-slate-400">of the month</span>
                             </div>
                          </div>
                        )}

                        {/* Precise Time Row */}
                        <div className="pt-4 border-t border-slate-200/60">
                           <span className="block text-[10px] font-bold text-slate-500 mb-4 px-1 uppercase tracking-wider">Trigger Time (24h)</span>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-300 uppercase pl-1 tracking-widest">Hour</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={23}
                                  value={form.timeHour}
                                  onChange={e => handleFormChange("timeHour", parseInt(e.target.value))}
                                  className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-base font-black text-slate-700 outline-none focus:border-indigo-400 text-center shadow-inner"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-300 uppercase pl-1 tracking-widest">Minute</span>
                                <select
                                  value={form.timeMinute}
                                  onChange={e => handleFormChange("timeMinute", parseInt(e.target.value))}
                                  className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-base font-black text-slate-700 shadow-inner outline-none focus:border-indigo-400 cursor-pointer"
                                >
                                  {[0, 15, 30, 45].map(m => (
                                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                  ))}
                                </select>
                              </div>
                           </div>
                           <p className="mt-4 text-[10px] text-slate-400 font-bold bg-white px-4 py-2 rounded-xl border border-slate-100 flex items-center justify-center gap-2">
                             <Clock size={12} className="text-indigo-400" /> Run at <span>{form.timeHour}:{String(form.timeMinute).padStart(2, '0')}</span> local time.
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles size={16} className="text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Templates save time & prevent manual errors</span>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-500 rounded-2.5xl text-xs font-black uppercase tracking-widest transition-all border-2 border-slate-100 active:scale-95"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !form.title || !form.type}
                    className="flex-1 md:flex-none px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.8rem] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-95"
                  >
                    {isSaving ? "Saving..." : editingId ? "Update Template" : "Start Automating"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
