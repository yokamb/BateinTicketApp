"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Repeat, Plus, Play, Pause, Trash2, Clock, RefreshCw,
  Calendar, ChevronRight, Settings2, Zap, ArrowLeft
} from "lucide-react";


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

export default function RecurringClient({ initialTemplates, workspaces, ticketTypes }: Props) {
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

  return (
    <div className="space-y-6 animate-fade-in text-sm">
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
            {isTriggering ? "Running..." : "Run Due Jobs"}
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
                      <RefreshCw size={10} /> Next: {new Date(t.nextRunAt).toLocaleDateString()}
                    </span>
                    {t.lastRunAt && (
                      <span>Last ran: {new Date(t.lastRunAt).toLocaleDateString()}</span>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start overflow-y-auto bg-black/40 backdrop-blur-sm p-4 sm:p-10 transition-all animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative animate-in slide-in-from-bottom-5 duration-300">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                {editingId ? "Edit Template" : "New Recurring Template"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Workspace */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Workspace</label>
                <select
                  value={form.workspaceId}
                  onChange={e => handleFormChange("workspaceId", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Template Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleFormChange("title", e.target.value)}
                  placeholder="e.g. Weekly Security Scan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => handleFormChange("description", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                />
              </div>

              {/* Ticket Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Ticket Type *</label>
                  <select
                    value={form.type}
                    onChange={e => {
                      const found = availableTypes.find(t => t.label === e.target.value);
                      handleFormChange("type", e.target.value);
                      if (found) handleFormChange("typeCategory", found.category);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
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
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => handleFormChange("priority", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Frequency *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => handleFormChange("frequency", f.value)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        form.frequency === f.value
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional: Day of week */}
              {(form.frequency === "WEEKLY" || form.frequency === "BIWEEKLY") && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Day of Week</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleFormChange("dayOfWeek", idx)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                          form.dayOfWeek === idx
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional: Day of month */}
              {form.frequency === "MONTHLY" && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Day of Month</label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={form.dayOfMonth}
                    onChange={e => handleFormChange("dayOfMonth", parseInt(e.target.value))}
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              )}

              {/* Time */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Time of Day</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={form.timeHour}
                    onChange={e => handleFormChange("timeHour", parseInt(e.target.value))}
                    className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400 text-center"
                  />
                  <span className="font-black text-slate-400">:</span>
                  <select
                    value={form.timeMinute}
                    onChange={e => handleFormChange("timeMinute", parseInt(e.target.value))}
                    className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
                  </select>
                  <span className="text-xs text-slate-400 font-medium">(24-hr)</span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.title || !form.type}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingId ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
