import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TicketForm from "./TicketForm";
import { prisma } from "@/lib/prisma";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  const { workspaceId } = await searchParams;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  let workspaces = [];
  const ownedWorkspaces = await (prisma as any).workspace.findMany({ 
    where: { adminId: user.id },
    include: { 
      customers: { include: { user: true } },
      ticketTypes: true
    }
  });
  const joinedWorkspaces = await (prisma as any).instanceAccess.findMany({ 
    where: { userId: user.id },
    include: { 
      workspace: { 
        include: { 
          customers: { include: { user: true } },
          ticketTypes: true
        } 
      } 
    }
  });

  // Map customers to approvers for the TicketForm which expects it
  const formattedWorkspaces = [
    ...ownedWorkspaces.map((w: any) => ({
      ...w,
      approvers: w.customers.filter((c: any) => c.role === "GUEST")
    })),
    ...joinedWorkspaces.map((j: any) => ({
      ...j.workspace,
      approvers: j.workspace.customers.filter((c: any) => c.role === "GUEST")
    }))
  ];
  
  workspaces = formattedWorkspaces;
  
  return (
    <div className="p-6 md:p-8 w-full">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
        <div className="text-slate-900">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create New Ticket</h1>
          <p className="text-xs text-slate-500 mt-1">Provide details to track this issue or task.</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 text-slate-900">
          <TicketForm 
            workspaces={workspaces} 
            defaultWorkspaceId={workspaceId} 
          />
        </div>
      </div>
    </div>
  );
}
