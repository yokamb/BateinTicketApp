import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ClientWorkspaces from "./ClientWorkspaces";

export default async function WorkspacesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const workspaces = await prisma.workspace.findMany({
    where: { adminId: user.id },
    include: {
      _count: {
        select: { tickets: true, customers: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Customer Workspaces</h1>
          <p className="text-slate-500 mt-1">Manage isolated instances for your clients.</p>
        </div>
      </div>
      
      <ClientWorkspaces initialWorkspaces={workspaces} />
    </div>
  );
}
