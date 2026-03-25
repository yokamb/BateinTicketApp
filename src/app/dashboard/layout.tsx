import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Logo from "@/components/Logo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const userSession = session.user as any;
  const user = await prisma.user.findUnique({ where: { id: userSession.id } }) || userSession;

  // Ensure every user has a default workspace
  const workspaceCount = await prisma.workspace.count({ where: { adminId: user.id } });
  if (workspaceCount === 0) {
    await prisma.workspace.create({
      data: {
        name: "My Workspace",
        adminId: user.id
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#0A0514] text-white flex relative overflow-hidden font-sans">
      {/* Abstract Backgrounds in Dashboard */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>

      {/* Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10 flex flex-col sticky top-0 h-screen overflow-y-auto backdrop-blur-xl relative z-20">
        <div className="p-6 border-b border-white/10 flex items-center justify-center">
          <Logo />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="block px-4 py-2 text-slate-300 hover:bg-white/10 hover:text-white rounded-lg font-medium transition-colors">
            Dashboard
          </Link>
          {user.plan === "FREE" || !user.plan ? (
            <div title="Upgrade to Pro to manage multiple workspaces" className="flex items-center justify-between px-4 py-2 opacity-70 blur-[0.7px] cursor-not-allowed select-none">
              <span className="text-slate-400 font-medium">Workspaces</span>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-wider">PRO</span>
            </div>
          ) : (
            <Link href="/dashboard/workspaces" className="block px-4 py-2 text-slate-300 hover:bg-white/10 hover:text-white rounded-lg font-medium transition-colors border border-transparent">
              Workspaces
            </Link>
          )}
          <Link href="/dashboard/tickets" className="block px-4 py-2 text-slate-300 hover:bg-white/10 hover:text-white rounded-lg font-medium transition-colors">
            Tickets
          </Link>
          <Link href="/dashboard/notes" className="block px-4 py-2 text-slate-300 hover:bg-white/10 hover:text-white rounded-lg font-medium transition-colors">
            Notes
          </Link>
          {user.plan !== "MAX" && (
            <div className="pt-4 mt-2 border-t border-white/10">
              <Link href="/pricing" className="block px-4 py-2 text-purple-300 hover:bg-purple-900/30 hover:text-purple-100 rounded-lg font-bold transition-colors flex items-center justify-between">
                Upgrade Plan
                <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
              </Link>
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-white/10 flex flex-col gap-3">
          <div className="flex items-center gap-3 relative group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors">
            <Link href="/dashboard/profile" className="absolute inset-0 z-10"></Link>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              {user.name?.[0] || user.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-medium text-white truncate">{user.name || "User"}</p>
              <p className="text-xs text-purple-300 truncate">{user.plan || "FREE"} {user.role}</p>
            </div>
          </div>
          <Link 
            href="/api/auth/signout"
            className="w-full mt-2 text-center text-sm py-2 px-4 rounded-xl text-red-400 hover:bg-red-500/20 font-medium transition-colors"
          >
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 text-slate-900 bg-slate-50 lg:rounded-tl-3xl lg:border-l lg:border-t lg:border-white/10 lg:shadow-[-20px_0_40px_rgba(0,0,0,0.3)] lg:mt-4 lg:ml-4">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
