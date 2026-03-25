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
  if (user.role === "ADMIN") {
    workspaces = await prisma.workspace.findMany({
      where: { adminId: user.id },
      include: { approvers: { include: { user: true } } }
    });
  } else {
    const accesses = await prisma.instanceAccess.findMany({
      where: { userId: user.id },
      include: { workspace: { include: { approvers: { include: { user: true } } } } }
    });
    workspaces = accesses.map((a: any) => a.workspace);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create New Ticket</h1>
        <p className="text-slate-500 mt-1">Provide details to track this issue or task.</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <TicketForm 
          workspaces={workspaces} 
          defaultWorkspaceId={workspaceId} 
        />
      </div>
    </div>
  );
}
