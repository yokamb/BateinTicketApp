"use client";

import Link from "next/link";
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
import Logo from "@/components/Logo";
import StorageTracker from "@/components/StorageTracker";

export default function Sidebar({ 
  dbUser, 
  allWorkspaces, 
  isGuest 
}: { 
  dbUser: any; 
  allWorkspaces: any[]; 
  isGuest: boolean;
}) {
  
  // Filter nav items: Guests only see Dashboard and Tickets
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
    ...(!isGuest ? [
      { name: "Notes", href: "/dashboard/notes", icon: NotebookIcon },
      { name: "Workspaces", href: "/dashboard/workspaces", icon: Briefcase },
    ] : [])
  ];


  return (
    <aside className="w-60 bg-[#f9f9f9] border-r border-[#e5e5e5] flex flex-col sticky top-0 h-screen z-20 shrink-0">
      {/* Logo */}
      <div className="p-4 pb-2">
        <Logo className="scale-90 origin-left" />
      </div>

      {/* New Ticket Button & Invite Link */}
      <div className="px-3 py-2 space-y-1">
        <Link 
          href="/dashboard/tickets/new" 
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[#0d0d0d] hover:bg-[#efefef] transition-colors group font-bold text-xs uppercase tracking-tighter"
        >
          <div className="w-6 h-6 bg-[#efefef] group-hover:bg-[#e0e0e0] rounded-md flex items-center justify-center transition-colors shrink-0">
            <Plus size={15} className="text-[#555]" />
          </div>
          New Ticket
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.name}>
            <Link 
              href={item.href} 
              className="flex items-center gap-2.5 px-3 py-2 text-[#444] hover:bg-[#efefef] hover:text-[#0d0d0d] rounded-lg font-medium transition-colors group text-sm"
            >
              <item.icon size={17} className="shrink-0 text-[#666] group-hover:text-[#111]" />
              {item.name}
            </Link>
          </div>
        ))}

        {/* Upgrade Link: Only for Owners/Admins */}
        {!isGuest && (
          <div className="pt-3 mt-2 border-t border-[#e5e5e5]">
            <Link href="/pricing" className="flex items-center gap-2.5 px-3 py-2 text-[#444] hover:bg-[#efefef] hover:text-[#0d0d0d] rounded-lg font-medium transition-colors text-sm">
              <Crown size={17} className={`${dbUser.plan === "MAX" ? "text-indigo-500" : "text-amber-500"} shrink-0`} />
              {dbUser.plan === "MAX" ? "Manage Plan & Storage" : "Upgrade Plan"}
            </Link>
          </div>
        )}
      </nav>
      
      {/* Storage Tracker: only for owners */}
      {!isGuest && (
        <div className="px-4 pb-2 pt-1 border-t border-[#f0f0f0] mt-2">
          <StorageTracker />
        </div>
      )}

      {/* User Footer */}
      <div className="p-3 border-t border-[#e5e5e5] flex flex-col gap-0.5">
        <Link 
          href="/dashboard/profile" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#efefef] transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-[#0d0d0d] flex items-center justify-center text-white font-bold shrink-0 text-[11px]">
            {dbUser.name?.[0]?.toUpperCase() || dbUser.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0d0d0d] truncate">{dbUser.name || "User"}</p>
            <p className="text-[10px] text-[#888] truncate uppercase font-medium tracking-wider">{isGuest ? "GUEST" : dbUser.plan || "FREE"}</p>
          </div>
          <Settings size={14} className="text-[#aaa] group-hover:text-[#555] shrink-0" />
        </Link>
        
        <Link 
          href="/api/auth/signout"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#888] hover:bg-red-50 hover:text-red-500 transition-colors group"
        >
          <LogOut size={15} className="shrink-0" />
          <span className="text-xs font-medium">Sign Out</span>
        </Link>
      </div>

    </aside>
  );
}
