import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import InviteCustomerForm from "./InviteCustomerForm";
import TicketList from "@/components/TicketList";
import ApproverSettings from "./ApproverSettings";
import TicketTypeSettings from "./TicketTypeSettings";
import WorkspaceGeneralSettings from "./WorkspaceGeneralSettings";

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      customers: {
        include: { user: true }
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        include: { creator: true }
      },
      ticketTypes: true
    }
  });

  if (!workspace) {
    redirect("/dashboard/workspaces");
  }

  // Check if user is either the admin or a member/customer
  const isOwner = workspace.adminId === user.id;
  const isMember = workspace.customers.some((c: any) => c.userId === user.id);

  if (!isOwner && !isMember) {
    redirect("/dashboard/workspaces");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-6 px-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{workspace.name}</h1>
          <p className="text-slate-500 mt-1">Manage this workspace's team and approval workflows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Tickets */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Workspace Tickets</h2>
              <Link href={`/dashboard/tickets/new?workspaceId=${workspace.id}`} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors">
                + Create Ticket
              </Link>
            </div>
            <TicketList tickets={workspace.tickets} workspaceId={workspace.id} isAdmin={true} />
          </div>
        </div>

        {/* Right Col: Settings */}
        <div className="space-y-6">
          {/* Workspace Info & Settings */}
          <WorkspaceGeneralSettings workspace={workspace} />
          
          {/* Ticket Type Settings */}
          <TicketTypeSettings workspaceId={workspace.id} />

          {/* Approver Settings */}
          <ApproverSettings workspace={workspace} />
        </div>
      </div>
    </div>
  );
}
