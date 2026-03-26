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
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="space-y-4 animate-fade-in text-sm text-slate-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workspaces</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage your customer instances and their dedicated support spaces.</p>
          </div>
        </div>
        
        <ClientWorkspaces initialWorkspaces={workspaces} />
      </div>
    </div>
  );
}
