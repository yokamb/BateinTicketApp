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
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, {user.name || "User"}</h1>
      <p className="text-slate-500">Here's an overview of your active operations.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
        {user.role === "ADMIN" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10h3v7H4zM10.5 10h3v7h-3zM2 19h20v3H2zM17 10h3v7h-3zM12 1L2 6v2h20V6L12 1z"/></svg>
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1 relative z-10">Active Workspaces</p>
            <p className="text-5xl font-black bg-gradient-to-br from-purple-600 to-indigo-600 bg-clip-text text-transparent relative z-10">{workspaceCount}</p>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1 relative z-10">Open Tickets</p>
          <p className="text-5xl font-black bg-gradient-to-br from-blue-500 to-cyan-500 bg-clip-text text-transparent relative z-10">{activeTicketsCount}</p>
        </div>
      </div>

      {/* Active Tickets List */}
      <div className="pt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
           <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
           Recent Active Tickets
        </h2>
        {recentTickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <p className="text-slate-500">No active tickets found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {recentTickets.map(ticket => (
                <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="block hover:bg-slate-50 transition-colors p-4 sm:p-6 group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200">{ticket.shortId}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${ticket.type === "INCIDENT" ? "bg-red-100 text-red-700" : ticket.type === "CHANGE" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{ticket.type}</span>
                        <span className="text-xs text-slate-500 font-medium">in {ticket.workspace.name}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-lg truncate leading-tight">
                        {ticket.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${ticket.status === "OPEN" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {ticket.status}
                      </span>
                      <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
