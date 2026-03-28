import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketList from "@/components/TicketList";
import Link from "next/link";

export default async function TicketsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  let tickets: any[] = [];
  let userWorkspaces: any[] = [];
  
  // Fetch tickets user has access to
  const ownedWorkspaces = await (prisma as any).workspace.findMany({ where: { adminId: user.id } });
  const joinedWorkspaces = await (prisma as any).instanceAccess.findMany({ 
    where: { userId: user.id }, 
    include: { workspace: true } 
  });
  
  const guestWorkspaceIds = joinedWorkspaces
    .filter((j: any) => j.role === 'GUEST')
    .map((j: any) => j.workspaceId);
    
  const fullAccessWorkspaceIds = [
    ...ownedWorkspaces.map((w: any) => w.id),
    ...joinedWorkspaces.filter((j: any) => j.role !== 'GUEST').map((j: any) => j.workspaceId)
  ];

  tickets = await (prisma as any).ticket.findMany({
    where: { 
      OR: [
        // Full access workspaces: see all tickets
        { workspaceId: { in: fullAccessWorkspaceIds } },
        // Guest workspaces: see ONLY Change tickets OR tickets they created they might have created themselves
        { 
          workspaceId: { in: guestWorkspaceIds },
          OR: [
            { typeCategory: "CHANGE" },
            { creatorId: user.id }
          ]
        }
      ]
    },
    include: { creator: true, workspace: true },
    orderBy: { createdAt: "desc" }
  });

  userWorkspaces = [
    ...ownedWorkspaces,
    ...joinedWorkspaces.map((j: any) => j.workspace)
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="space-y-4 animate-fade-in text-sm text-slate-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Support Tickets</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage and track customer requests.</p>
          </div>
          <Link 
            href="/dashboard/tickets/new" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            Create Ticket
          </Link>
        </div>
        <div className="bg-white rounded-xl p-0 sm:p-4 border-0 sm:border border-slate-200 shadow-none sm:shadow-sm">
           {/* the workspaceId="" prevents the list from showing 'New Ticket' if we don't have a specific workspace context here. We added a global button instead above. */}
          <TicketList tickets={tickets} workspaceId={""} isAdmin={user.role === "ADMIN"} professionalRole={user.professionalRole} />
        </div>
      </div>
    </div>
  );
}
