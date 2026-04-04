"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Repeat, Plus, Play, Pause, Trash2, Clock, RefreshCw,
  Calendar, ChevronRight, Settings2, Zap, ArrowLeft, Globe, X
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
  const router = useRouter();

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
      const res = await fetch("/api/recurring/trigger", { method: "POST" });
      const data = await res.json();
      alert(`✅ ${data.triggered} ticket(s) created from due templates.`);
      router.refresh();
    } catch (e) {
      alert("Error triggering jobs.");
    } finally {
      setIsTriggering(false);
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
            >
              <Zap size={13} className={isTriggering ? "animate-pulse" : ""} />
              {isTriggering ? "Run Due Jobs" : "Run Due Jobs"}
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Plus size={14} /> New Template
            </button>
          </div>
        </div>

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

      {/* Drawer Overlay - Using Portal-like fixed positioning at root */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
          onClick={() => setShowModal(false)}
        />
      )}

      {/* Side Drawer - Absolute positioning fix */}
      <div 
        className={`fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out transform ${
          showModal ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ visibility: showModal ? "visible" : "hidden" }}
      >
        <div className="h-full flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {editingId ? "Edit Template" : "New Recurring Template"}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                 <Globe size={10} className="text-slate-400" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Timezone: {userTimezone}</span>
              </div>
            </div>
            <button 
              onClick={() => setShowModal(false)}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-5">
              {/* Workspace */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Select Workspace</label>
                <select
                  value={form.workspaceId}
                  onChange={e => handleFormChange("workspaceId", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 transition-all shadow-sm"
                >
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Basic Info Group */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Template Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => handleFormChange("title", e.target.value)}
                    placeholder="e.g. Weekly Security Scan"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => handleFormChange("description", e.target.value)}
                    rows={3}
                    placeholder="What should this ticket be about?"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition-all"
                  />
                </div>
              </div>

              {/* Type & Priority Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Ticket Type *</label>
                  <select
                    value={form.type}
                    onChange={e => {
                      const found = availableTypes.find(t => t.label === e.target.value);
                      handleFormChange("type", e.target.value);
                      if (found) handleFormChange("typeCategory", found.category);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 transition-all"
                    disabled={availableTypes.length === 0}
                  >
                    {availableTypes.length > 0 ? (
                      <>
                        <option value="" disabled>— Select Type —</option>
                        {availableTypes.map(t => (
                          <option key={t.id} value={t.label}>{t.label}</option>
                        ))}
                      </>
                    ) : (
                      <option value="">No types found</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => handleFormChange("priority", e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="pt-4 border-t border-slate-100 space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2.5 tracking-widest flex items-center gap-1.5">
                    <Calendar size={12} className="text-violet-500" /> Schedule Frequency *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FREQUENCIES.map(f => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => handleFormChange("frequency", f.value)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border-2 ${
                          form.frequency === f.value
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]"
                            : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional: Days selection */}
                {(form.frequency === "WEEKLY" || form.frequency === "BIWEEKLY") && (
                  <div className="animate-in fade-in slide-in-from-left-2 transition-all">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Select Day of Week</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleFormChange("dayOfWeek", idx)}
                          className={`flex-1 min-w-[50px] py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${
                            form.dayOfWeek === idx
                              ? "bg-violet-500 text-white border-violet-500 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.frequency === "MONTHLY" && (
                  <div className="animate-in fade-in slide-in-from-left-2 transition-all">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Day of Month</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={28}
                        value={form.dayOfMonth}
                        onChange={e => handleFormChange("dayOfMonth", parseInt(e.target.value))}
                        className="w-20 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <span className="text-xs font-bold text-slate-400 underline underline-offset-4 decoration-dotted">of the month</span>
                    </div>
                  </div>
                )}

                {/* Time Selection */}
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-3">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                    <Clock size={12} className="text-indigo-500" /> Start Time (Local: {userTimezone})
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-1">Hour</span>
                       <input
                         type="number"
                         min={0}
                         max={23}
                         value={form.timeHour}
                         onChange={e => handleFormChange("timeHour", parseInt(e.target.value))}
                         className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 text-center shadow-sm"
                       />
                    </div>
                    <span className="font-black text-slate-300 pt-5">:</span>
                    <div className="flex-1 flex flex-col gap-1">
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-1">Minute</span>
                       <select
                         value={form.timeMinute}
                         onChange={e => handleFormChange("timeMinute", parseInt(e.target.value))}
                         className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                       >
                         {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
                       </select>
                    </div>
                    <div className="pt-5 flex items-center gap-1 min-w-[50px] justify-center">
                       <span className="text-xs font-black text-slate-400">{form.timeHour >= 12 ? "PM" : "AM"}</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium italic">This job will run at {form.timeHour}:{String(form.timeMinute).padStart(2, '0')} in your local time.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-6 border-t border-slate-100 flex flex-col gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !form.title || !form.type}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSaving ? "Processing..." : editingId ? "Update Template" : "Create Recurring Template"}
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-colors border border-slate-100"
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
