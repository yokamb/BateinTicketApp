import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Logo from "@/components/Logo";
import StorageTracker from "@/components/StorageTracker";
import { 
  LayoutDashboard, 
  Briefcase, 
  Ticket, 
  NotebookIcon, 
  Plus, 
  LogOut, 
  Crown,
  Settings
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const userSession = session.user as any;
  const dbUser = await prisma.user.findUnique({ where: { id: userSession.id } });
  
  if (!dbUser) {
    // Session exists but user was deleted from DB (e.g. after wipe)
    redirect("/api/auth/signout");
  }

  // Fetch workspaces user has access to
  const ownedWorkspaces = await prisma.workspace.findMany({ where: { adminId: dbUser.id } });
  const joinedWorkspaces = await prisma.instanceAccess.findMany({
    where: { userId: dbUser.id },
    include: { workspace: true }
  });

  const allWorkspaces = [
    ...ownedWorkspaces,
    ...joinedWorkspaces.map((j: any) => j.workspace)
  ];

  // Only auto-create if they have ZERO access anywhere
  if (allWorkspaces.length === 0) {
    const newWs = await prisma.workspace.create({
      data: {
        name: "My Workspace",
        adminId: dbUser.id
      }
    });
    allWorkspaces.push(newWs);
    ownedWorkspaces.push(newWs);
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
    { name: "Notes", href: "/dashboard/notes", icon: NotebookIcon },
    { name: "Workspaces", href: "/dashboard/workspaces", icon: Briefcase },
  ];

  const isGuest = dbUser.role === "GUEST" || (allWorkspaces.length > 0 && !ownedWorkspaces.some((w: any) => w.adminId === dbUser.id));

  return (
    <div className="min-h-screen bg-white text-[#0d0d0d] flex relative font-sans text-sm antialiased">
        {/* Sidebar - ChatGPT Style */}
        <Sidebar 
          dbUser={dbUser} 
          allWorkspaces={allWorkspaces} 
          isGuest={isGuest}
        />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white text-[#0d0d0d]">
        {children}
      </main>
    </div>
  );
}
