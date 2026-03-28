"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, CheckCircle, FileText, Download } from "lucide-react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN": return "bg-red-50 text-red-700 border-red-200";
    case "IN_PROGRESS": return "bg-orange-50 text-orange-700 border-orange-200";
    case "RESOLVED": return "bg-green-50 text-green-700 border-green-200";
    case "CLOSED": return "bg-slate-100 text-slate-700 border-slate-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "OPEN": return <AlertCircle size={14} className="mr-1" />;
    case "IN_PROGRESS": return <Clock size={14} className="mr-1" />;
    case "RESOLVED": return <CheckCircle size={14} className="mr-1" />;
    case "CLOSED": return <CheckCircle size={14} className="mr-1 opacity-50" />;
    default: return null;
  }
};

export default function TicketList({ tickets, workspaceId, isAdmin }: { tickets: any[], workspaceId: string, isAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState("ALL");

  const tabs = [
    { id: "ALL", label: "All Tickets" },
    { id: "OPEN", label: "Open" },
    { id: "IN_PROGRESS", label: "InProgress" },
    { id: "RESOLVED", label: "Resolved" },
    { id: "CLOSED", label: "Closed" },
  ];

  const getTabCount = (tabId: string) => {
    if (tabId === "ALL") return tickets.length;
    return tickets.filter(t => t.status === tabId).length;
  };

  const filteredTickets = activeTab === "ALL" ? tickets : tickets.filter(t => t.status === activeTab);

  const handleExportCSV = () => {
    if (filteredTickets.length === 0) return;
    const headers = ["Ticket ID", "Title", "Type", "Status", "Priority", "Creator", "Created At"];
    const rows = filteredTickets.map(t => [
      t.shortId || t.id,
      `"${(t.title || "").replace(/"/g, '""')}"`,
      t.type || "INCIDENT",
      t.status || "OPEN",
      t.priority || "MEDIUM",
      `"${(t.creator?.name || t.creator?.email || "Unknown").replace(/"/g, '""')}"`,
      new Date(t.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tickets_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (tickets.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 mt-4">
        <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <h3 className="text-xs font-medium text-slate-900">No tickets found</h3>
        <p className="text-[10px] text-slate-500 mt-0.5 mb-3">Get started by creating a new ticket.</p>
        <Link
          href={`/dashboard/tickets/new?workspaceId=${workspaceId}`}
          className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Create First Ticket
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
       <div className="flex border-b border-slate-200 mb-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{getTabCount(tab.id)}</span>
          </button>
        ))}
       </div>

       <div className="flex justify-between items-center pb-1 mb-3">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">{filteredTickets.length} matching tickets</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredTickets.length === 0}
            className="text-slate-600 font-medium hover:text-slate-900 text-[11px] flex items-center gap-1.5 border border-slate-200 px-2.5 py-1 rounded-lg bg-white shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {filteredTickets.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">No tickets matching this status.</div>
        ) : filteredTickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/dashboard/tickets/${ticket.id}`}
            className="block w-full text-left bg-white border border-slate-200 hover:border-indigo-300 hover:shadow shadow-sm transition-all rounded-lg p-3 group"
          >
            <div className="flex justify-between items-start mb-0.5">
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                 <span className="text-indigo-500 font-mono text-[11px] mr-1.5">{ticket.shortId}</span> 
                 {ticket.title}
              </h4>
              <div className="flex gap-2 shrink-0 ml-3">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight bg-slate-100 text-slate-600 border border-slate-200">
                  {ticket.type}
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mb-2 leading-relaxed opacity-80">
              {ticket.description}
            </p>
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-50">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[8px]">
                  {ticket.creator?.name?.[0] || 'U'}
                </span>
                {ticket.creator?.name}
              </span>
              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

