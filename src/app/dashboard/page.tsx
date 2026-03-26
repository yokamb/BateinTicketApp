import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  let workspaceCount = 0;
  let activeTicketsCount = 0;
  let recentTickets: any[] = [];

  if (user.role === "ADMIN") {
    workspaceCount = await prisma.workspace.count({ where: { adminId: user.id } });
    activeTicketsCount = await prisma.ticket.count({ 
      where: { workspace: { adminId: user.id }, status: { not: "CLOSED" } }
    });
    
    recentTickets = await prisma.ticket.findMany({
      where: { workspace: { adminId: user.id }, status: { not: "CLOSED" } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { workspace: true }
    });
  } else {
    // Customer
    activeTicketsCount = await prisma.ticket.count({
      where: { creatorId: user.id, status: { not: "CLOSED" } }
    });
    
    recentTickets = await prisma.ticket.findMany({
      where: { creatorId: user.id, status: { not: "CLOSED" } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { workspace: true }
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="space-y-4 animate-fade-in text-sm text-slate-900">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Welcome back, {user.name || "User"}</h1>
        <p className="text-xs text-slate-500">Here's an overview of your active operations.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {user.role === "ADMIN" && (
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10h3v7H4zM10.5 10h3v7h-3zM2 19h20v3H2zM17 10h3v7h-3zM12 1L2 6v2h20V6L12 1z"/></svg>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 relative z-10">Active Workspaces</p>
              <p className="text-3xl font-black bg-gradient-to-br from-purple-600 to-indigo-600 bg-clip-text text-transparent relative z-10">{workspaceCount}</p>
            </div>
          )}
          
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 relative z-10">Open Tickets</p>
            <p className="text-3xl font-black bg-gradient-to-br from-blue-500 to-cyan-500 bg-clip-text text-transparent relative z-10">{activeTicketsCount}</p>
          </div>
        </div>

        {/* Active Tickets List */}
        <div className="pt-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
             <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
             Recent Active Tickets
          </h2>
          {recentTickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-sm">
              <p className="text-xs text-slate-500">No active tickets found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {recentTickets.map(ticket => (
                  <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="block hover:bg-slate-50 transition-colors p-3 sm:p-4 group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">{ticket.shortShortId || ticket.shortId}</span>
                          <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full ${ticket.type === "INCIDENT" ? "bg-red-100 text-red-700" : ticket.type === "CHANGE" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{ticket.type}</span>
                          <span className="text-[10px] text-slate-500">in {ticket.workspace.name}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm truncate leading-tight">
                          {ticket.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${ticket.status === "OPEN" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {ticket.status}
                        </span>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

