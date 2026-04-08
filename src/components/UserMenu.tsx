"use client";

import Link from "next/link";
import { Settings, LogOut } from "lucide-react";

export default function UserMenu({
  dbUser,
  isGuest
}: {
  dbUser: any;
  isGuest: boolean;
}) {
  const initials = dbUser.name?.[0]?.toUpperCase() || dbUser.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="flex items-center gap-4">
      {/* Settings / Profile Link */}
      <Link
        href="/dashboard/profile"
        className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-[#efefef] transition-all group border border-transparent hover:border-[#e5e5e5]"
      >
        <div className="w-8 h-8 rounded-full bg-[#0d0d0d] flex items-center justify-center text-white font-bold shrink-0 text-xs shadow-sm">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-bold text-[#0d0d0d] leading-none mb-0.5">{dbUser.name || "User"}</p>
          <p className="text-[9px] text-[#888] uppercase font-bold tracking-wider leading-none">
            {isGuest ? "GUEST" : dbUser.plan || "FREE"}
          </p>
        </div>
        <Settings size={14} className="text-[#aaa] group-hover:text-[#555] ml-1 transition-colors" />
      </Link>

      {/* Sign Out */}
      <Link
        href="/api/auth/signout"
        className="flex items-center justify-center w-9 h-9 rounded-full text-[#888] hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
        title="Sign Out"
      >
        <LogOut size={16} />
      </Link>
    </div>
  );
}
