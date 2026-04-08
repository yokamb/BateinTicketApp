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
    <div className="min-h-screen text-[#0d0d0d] flex relative font-sans text-sm antialiased selection:bg-indigo-100">
      {/* Absolute Base Layer: White Background */}
      <div className="fixed inset-0 z-[-2] bg-white"></div>
      
      {/* Absolute Middle Layer: Subtle Tech Pattern Background */}
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.08]"
        style={{ backgroundImage: "url('/bg-pattern.png')", backgroundRepeat: "repeat", backgroundSize: "400px" }}
      ></div>
      {/* Force password change guard */}
      <ForcePasswordReset />

      {/* Sidebar */}
      <Sidebar
        dbUser={dbUser}
        allWorkspaces={allWorkspaces}
        isGuest={isGuest}
      />

      {/* Main Content — pt-14 on mobile accounts for the fixed top bar */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent text-[#0d0d0d] pt-14 md:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
