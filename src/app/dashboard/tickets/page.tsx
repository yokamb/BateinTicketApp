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
  
  if (user.role === "ADMIN") {
    tickets = await prisma.ticket.findMany({
      where: { workspace: { adminId: user.id } },
      include: { creator: true, workspace: true },
      orderBy: { createdAt: "desc" }
    });
  } else {
    // customers see tickets in their granted workspaces
    tickets = await prisma.ticket.findMany({
      where: { workspace: { customers: { some: { userId: user.id } } } },
      include: { creator: true, workspace: true },
      orderBy: { createdAt: "desc" }
    });
    
    // fetch the customer's workspaces to know where they can create tickets
    const accesses = await prisma.instanceAccess.findMany({
      where: { userId: user.id },
      include: { workspace: true }
    });
    userWorkspaces = accesses.map((a: any) => a.workspace);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Support Tickets</h1>
          <p className="text-slate-500 mt-1">Manage and track issues across all instances.</p>
        </div>
        
        {/* Only show "New Ticket" here if Customer has 1 workspace or we want a global create button */}
        {user.role === "CUSTOMER" && userWorkspaces.length > 0 && (
          <Link
            href={`/dashboard/tickets/new?workspaceId=${userWorkspaces[0].id}`}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            + Create Ticket
          </Link>
        )}
      </div>
      
      <div className="bg-white rounded-2xl p-0 sm:p-6 border-0 sm:border border-slate-200 shadow-none sm:shadow-sm">
         {/* the workspaceId="" prevents the list from showing 'New Ticket' if we don't have a specific workspace context here. We added a global button instead above. */}
        <TicketList tickets={tickets} workspaceId={""} isAdmin={user.role === "ADMIN"} />
      </div>
    </div>
  );
}
