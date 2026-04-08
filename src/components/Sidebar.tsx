"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Ticket,
  NotebookIcon,
  Plus,
  LogOut,
  Crown,
  Settings,
  Repeat,
  BarChart2,
  Menu,
  X,
  FileBarChart
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
    ...(!isGuest ? [
      { name: "Recurring", href: "/dashboard/recurring", icon: Repeat },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
      { name: "Reports", href: "/dashboard/reports", icon: FileBarChart },
      { name: "Notes", href: "/dashboard/notes", icon: NotebookIcon },
      { name: "Workspaces", href: "/dashboard/workspaces", icon: Briefcase },
    ] : [])
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <Logo className="origin-left" />
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#efefef] text-[#555] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* New Ticket Button */}
      {!isGuest && (
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
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium transition-colors group text-sm ${isActive
                    ? "bg-[#efefef] text-[#0d0d0d] font-semibold"
                    : "text-[#444] hover:bg-[#efefef] hover:text-[#0d0d0d]"
                  }`}
              >
                <item.icon size={17} className={`shrink-0 ${isActive ? "text-[#111]" : "text-[#666] group-hover:text-[#111]"}`} />
                {item.name}
              </Link>
            </div>
          );
        })}

        {/* Upgrade Link */}
        {!isGuest && (
          <div className="pt-3 mt-2 border-t border-[#e5e5e5]">
            <Link href="/pricing" className="flex items-center gap-2.5 px-3 py-2.5 text-[#444] hover:bg-[#efefef] hover:text-[#0d0d0d] rounded-lg font-medium transition-colors text-sm">
              <Crown size={17} className={`${dbUser.plan === "MAX" ? "text-indigo-500" : "text-amber-500"} shrink-0`} />
              {dbUser.plan === "MAX" ? "Manage Plan" : "Upgrade Plan"}
            </Link>
          </div>
        )}
      </nav>

      {/* Storage Tracker */}
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
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#f9f9f9] border-b border-[#e5e5e5] flex items-center justify-between px-4">
        <Logo className="scale-100 origin-left" />
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#efefef] text-[#444] transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#f9f9f9] border-r border-[#e5e5e5] flex flex-col transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-[#f9f9f9] border-r border-[#e5e5e5] flex-col sticky top-0 h-screen z-20 shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
