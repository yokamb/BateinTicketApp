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
  Crown
} from "lucide-react";
import UserMenu from "@/components/UserMenu";
import Sidebar from "@/components/Sidebar";
import ForcePasswordReset from "@/components/ForcePasswordReset";

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

  const isGuest = dbUser.role === "CUSTOMER";

  // Only auto-create if they have ZERO access anywhere and are NOT a Guest/Customer
  if (allWorkspaces.length === 0 && dbUser.role !== "CUSTOMER") {
    const newWs = await prisma.workspace.create({
      data: {
        name: `${dbUser.name || "My"}'s Workspace`,
        adminId: dbUser.id
      }
    });
    allWorkspaces.push(newWs);
    ownedWorkspaces.push(newWs);
  }

  return (
    <div className="min-h-screen bg-white text-[#0d0d0d] flex relative font-sans text-sm antialiased">
        {/* Force password change guard */}
        <ForcePasswordReset />

        {/* Sidebar */}
        <Sidebar
          dbUser={dbUser}
          allWorkspaces={allWorkspaces}
          isGuest={isGuest}
        />

      {/* Main Content — pt-14 on mobile accounts for the fixed top bar */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white text-[#0d0d0d] pt-14 md:pt-0 min-w-0">
        <header className="hidden md:flex sticky top-0 bg-white/80 backdrop-blur-md z-10 h-16 border-b border-[#f0f0f0] items-center justify-end px-8">
          <UserMenu dbUser={dbUser} isGuest={isGuest} />
        </header>
        {children}
      </main>
    </div>
  );
}
