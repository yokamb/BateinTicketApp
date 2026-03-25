import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import InviteCustomerForm from "./InviteCustomerForm";
import TicketList from "@/components/TicketList";
import ApproverSettings from "./ApproverSettings";

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      customers: {
        include: { user: true }
      },
      approvers: {
        include: { user: true }
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        include: { creator: true }
      }
    }
  });

  if (!workspace || workspace.adminId !== user.id) {
    redirect("/dashboard/workspaces");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{workspace.name}</h1>
          <p className="text-slate-500 mt-1">Manage this workspace's customers and tickets.</p>
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

        {/* Right Col: Customers & Settings */}
        <div className="space-y-6">
          {/* Approver Settings */}
          <ApproverSettings workspace={workspace} />

          {/* Customers List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Customers</h2>
            <ul className="space-y-3 mb-6">
              {workspace.customers.map((c: any) => (
                <li key={c.userId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-xs">
                    {c.user.name?.[0] || c.user.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{c.user.name || "Customer"}</p>
                    <p className="text-xs text-slate-500 truncate">{c.user.email}</p>
                  </div>
                </li>
              ))}
              {workspace.customers.length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-2">No customers invited yet.</p>
              )}
            </ul>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Invite Customer</h3>
              <InviteCustomerForm workspaceId={workspace.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
