import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TicketTypeBadge } from "@/components/TicketTypeBadge";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  let workspaceCount = 0;
  let activeTicketsCount = 0;
  let recentTickets: any[] = [];

  if (user.role === "ADMIN") {
    workspaceCount = await (prisma as any).workspace.count({ where: { adminId: user.id } });
    activeTicketsCount = await (prisma as any).ticket.count({ 
      where: { workspace: { adminId: user.id }, status: { not: "CLOSED" } }
    });
    
    recentTickets = await (prisma as any).ticket.findMany({
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
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
      <div className="space-y-6 text-sm">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-[#0d0d0d] tracking-tight">Welcome back, {user.name?.split(" ")[0] || "User"}</h1>
          <p className="text-xs text-[#888] mt-0.5">Here's an overview of your active operations.</p>
        </div>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {user.role === "ADMIN" && (
            <div className="bg-white p-4 rounded-xl border border-[#e5e5e5] hover:border-[#ccc] transition-colors">
              <p className="text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-2">Active Workspaces</p>
              <p className="text-3xl font-bold text-[#0d0d0d]">{workspaceCount}</p>
            </div>
          )}
          
          <div className="bg-white p-4 rounded-xl border border-[#e5e5e5] hover:border-[#ccc] transition-colors">
            <p className="text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-2">Open Tickets</p>
            <p className="text-3xl font-bold text-[#0d0d0d]">{activeTicketsCount}</p>
          </div>
        </div>

        {/* Recent Tickets */}
        <div>
          <h2 className="text-sm font-semibold text-[#0d0d0d] mb-3">Recent Active Tickets</h2>
          {recentTickets.length === 0 ? (
            <div className="rounded-xl border border-[#e5e5e5] p-8 text-center">
              <p className="text-xs text-[#888]">No active tickets found.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#e5e5e5] overflow-hidden">
              <div className="divide-y divide-[#f0f0f0]">
                {recentTickets.map(ticket => (
                  <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="block hover:bg-[#fafafa] transition-colors p-3 sm:p-4 group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#f0f0f0] text-[#666] rounded font-mono">{ticket.shortId}</span>
                          <TicketTypeBadge type={ticket.type} professionalRole={user.professionalRole} />
                          <span className="text-[10px] text-[#aaa]">in {ticket.workspace.name}</span>
                        </div>
                        <h3 className="font-medium text-[#0d0d0d] group-hover:text-[#555] transition-colors text-sm truncate leading-tight">
                          {ticket.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${ticket.status === "OPEN" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                        <svg className="w-3.5 h-3.5 text-[#ccc] group-hover:text-[#888] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
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

