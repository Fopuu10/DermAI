"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Camera,
  ClipboardList,
  Sparkles,
  Users,
  BookOpen,
  Microscope,
  MessageCircle,
  User,
  LogOut,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ChatDrawer from "./ChatDrawer";
import { LogoMark } from "./Logo";
import LogoutButton from "./LogoutButton";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/scan", label: "AI Scan", icon: Camera },
  { href: "/history", label: "History", icon: ClipboardList },
  { href: "/routines", label: "Routines", icon: Sparkles },
  { href: "/community", label: "Community", icon: Users },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/conditions", label: "Conditions", icon: Microscope },
  { href: "/chat", label: "Derma Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

const TITLES: Record<string, string> = {
  "/dashboard": "",
  "/scan": "AI Skin Scan",
  "/history": "History",
  "/routines": "My Routines",
  "/community": "Community",
  "/learn": "Learn",
  "/conditions": "Condition Library",
  "/chat": "Derma Chat",
  "/profile": "Profile",
  "/subscription": "Premium",
  "/followups": "Follow-ups",
  "/progress": "Progress",
  "/admin": "Admin",
};

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { fullName: string | null; email: string; premium: boolean };
}) {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);

  const initial = (user.fullName ?? user.email)[0]?.toUpperCase() ?? "U";
  const titleKey = Object.keys(TITLES).find((k) => pathname === k || pathname.startsWith(k + "/"));
  const pageTitle = titleKey ? TITLES[titleKey] : "";
  const isHome = pathname === "/dashboard";
  const isChat = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div className="min-h-screen bg-cream md:flex">
      {/* Desktop sidebar — fixed, full height, doesn't scroll with content */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 flex-col border-r border-slate-200 bg-white z-10">
        <div className="px-5 py-5 flex items-center gap-2 flex-shrink-0">
          <LogoMark />
          <span className="font-bold text-slate-900 text-lg">DermAI</span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
                  active
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-brand text-white grid place-items-center font-semibold">
              {initial}
            </div>
            <div className="text-xs flex-1 min-w-0">
              <div className="font-semibold text-slate-800 uppercase truncate">
                {user.fullName ?? "User"}
              </div>
              <div className="text-slate-400 truncate">{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column — offset for fixed sidebar */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-60">
        {/* Top bar — sticky */}
        <header className="hidden md:flex sticky top-0 z-20 items-center px-8 py-4 bg-white/90 backdrop-blur border-b border-slate-100">
          <div className="flex-1">
            {isHome ? (
              <div>
                <div className="text-xs text-slate-400">Good day,</div>
                <div className="text-lg font-semibold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                  {(user.fullName ?? user.email).split(" ")[0]} <span>👋</span>
                </div>
              </div>
            ) : (
              <h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1>
            )}
          </div>
          <button
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 grid place-items-center text-slate-500"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
          <div className="ml-2">
            <LogoutButton />
          </div>
        </header>

        {/* Mobile top bar — sticky */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white/90 backdrop-blur">
          <LogoMark size={32} />
          <span className="font-bold text-slate-900">DermAI</span>
          <Link href="/profile" className="ml-auto">
            <div className="w-8 h-8 rounded-full bg-brand text-white grid place-items-center font-semibold text-xs">
              {initial}
            </div>
          </Link>
        </header>

        <div className="flex-1 pb-20 md:pb-8 overflow-x-hidden">{children}</div>
      </main>

      {/* Floating chat button — hide on chat page */}
      {!isChat && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed right-5 bottom-24 md:bottom-6 z-30 w-14 h-14 rounded-full bg-brand text-white shadow-lg grid place-items-center hover:bg-brand-700"
          aria-label="Open chat"
        >
          <MessageCircle size={22} />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-coral text-[10px] grid place-items-center text-white font-bold">
            ✨
          </span>
        </button>
      )}

      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 grid grid-cols-5">
        {[NAV[0], NAV[1], NAV[2], NAV[7], NAV[8]].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 text-[10px]",
                active ? "text-brand-700" : "text-slate-500",
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
