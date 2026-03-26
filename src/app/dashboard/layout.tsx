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
  User,
  Crown
} from "lucide-react";

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

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Workspaces", href: "/dashboard/workspaces", icon: Briefcase, restricted: user.plan === "FREE" || !user.plan, badge: "PRO" },
    { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
    { name: "Notes", href: "/dashboard/notes", icon: NotebookIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0A0514] text-white flex relative overflow-hidden font-sans text-sm">
      {/* Abstract Backgrounds in Dashboard */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>

      {/* Sidebar - ChatGPT Style */}
      <aside className="w-64 bg-black/40 border-r border-white/10 flex flex-col sticky top-0 h-screen backdrop-blur-3xl relative z-20">
        <div className="p-4 mb-2">
          <Logo className="scale-90" />
        </div>

        <div className="px-3 mb-6">
          <Link 
            href="/dashboard/tickets/new" 
            className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group font-medium text-sm"
          >
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Plus size={18} className="text-white" />
            </div>
            New Ticket
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.restricted ? (
                <div title="Upgrade to Pro" className="flex items-center justify-between px-3 py-2 opacity-50 cursor-not-allowed group">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-slate-400" />
                    <span className="text-slate-400 font-medium">{item.name}</span>
                  </div>
                  <span className="text-[9px] font-black bg-amber-600/20 text-amber-500 border border-amber-600/30 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                    {item.badge}
                  </span>
                </div>
              ) : (
                <Link 
                  href={item.href} 
                  className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-all group group-active:scale-95 text-sm"
                >
                  <item.icon size={18} className="text-slate-400 group-hover:text-white" />
                  {item.name}
                </Link>
              )}
            </div>
          ))}

          {user.plan !== "MAX" && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <Link href="/pricing" className="flex items-center gap-3 px-3 py-2 text-purple-300 hover:bg-purple-900/30 hover:text-purple-100 rounded-xl font-bold transition-all text-sm">
                <Crown size={18} className="text-purple-400" />
                Upgrade Plan
              </Link>
            </div>
          )}
        </nav>
        
        <div className="px-4 mb-4 mt-auto">
          <StorageTracker />
        </div>

        <div className="p-3 border-t border-white/10 flex flex-col gap-1">
          <Link 
            href="/dashboard/profile" 
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 text-xs">
              {user.name?.[0] || user.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs font-semibold text-white truncate">{user.name || "User"}</p>
              <p className="text-[10px] text-purple-300 truncate uppercase font-medium">{user.plan || "FREE"}</p>
            </div>
          </Link>
          
          <Link 
            href="/api/auth/signout"
            className="flex items-center gap-3 p-2 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group mt-1"
          >
            <LogOut size={16} />
            <span className="text-xs font-medium">Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 text-slate-900 bg-slate-50 lg:rounded-tl-3xl lg:border-l lg:border-t lg:border-white/10 lg:shadow-[-20px_0_40px_rgba(0,0,0,0.3)] lg:mt-3 lg:ml-3">
        {children}
      </main>
    </div>
  );
}

