"use client";

import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  History,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Shield,
  UsersRound
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ChatUnreadBadge } from "@/components/chat-unread-badge";
import type { UserRole } from "@/lib/models";
import { cn } from "@/lib/utils";

type SidebarProps = {
  active: string;
  collapsed: boolean;
  onToggle: () => void;
 
  role: UserRole;
 
};

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  key: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { label: "Pipeline", href: "/pipeline", icon: BriefcaseBusiness, key: "pipeline" },
  { label: "Interviews", href: "/interviews", icon: CalendarClock, key: "interviews" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, key: "analytics" },
  { label: "Messages", href: "/chat", icon: MessageCircle, key: "chat" },
  { label: "Team", href: "/team", icon: UsersRound, key: "team" },
  { label: "Payments", href: "/payments", icon: CreditCard, key: "payments" },
  { label: "Settings", href: "/settings", icon: Settings, key: "settings" }
];

 
export function Sidebar({ active, collapsed, onToggle, role }: SidebarProps) {
  const items = (() => {
    if (role === "admin") {
      return [
        ...navItems.slice(0, 7),
        { label: "Activity", href: "/activity", icon: History, key: "activity" },
        { label: "Users", href: "/users", icon: Shield, key: "users" },
        navItems[7]
      ];
    }

    if (role === "bidder") {
      return [
        navItems[0],
        { label: "My bids", href: "/pipeline", icon: BriefcaseBusiness, key: "pipeline" },
        navItems[3],
        navItems[4],
        navItems[7]
      ];
    }

    return navItems.filter((item) => item.key !== "users" && item.key !== "activity");
  })();

  return (
    <aside
      className={cn(
        "relative hidden min-h-screen shrink-0 border-r bg-white transition-[width] duration-300 ease-out lg:block",
        collapsed ? "w-[92px]" : "w-72"
      )}
    >
 
      <div className="sticky top-0 flex h-screen flex-col">
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
          className="absolute right-0 top-1/2 z-20 flex size-11 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border bg-white shadow-lg transition-colors hover:bg-slate-50"
        >
          {collapsed ? (
            <ChevronRight className="size-4 text-slate-700" aria-hidden="true" />
          ) : (
            <ChevronLeft className="size-4 text-slate-700" aria-hidden="true" />
          )}
        </button>

        <Link
          href="/"
          className={cn(
            "flex h-16 items-center border-b transition-[padding,gap] duration-300 ease-out",
            collapsed ? "justify-center px-3" : "gap-3 px-6"
          )}
        >
 
          <BrandLogo collapsed={collapsed} />
        </Link>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center rounded-lg py-2.5 text-[20px] font-semibold leading-none text-muted-foreground transition-all duration-300 ease-out hover:bg-muted hover:text-foreground",
                  collapsed ? "justify-center px-1.5" : "gap-2 px-2.5",
                  active === item.key &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                >
                  <Icon className="size-6 shrink-0 stroke-[1.8]" aria-hidden="true" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                    collapsed ? "max-w-0 opacity-0" : "max-w-[185px] opacity-100"
                  )}
                  >
                    {item.label}
                  </span>
                  {item.key === "chat" ? (
                    <ChatUnreadBadge className={collapsed ? "right-1 top-1" : "right-3 top-1/2 -translate-y-1/2"} />
                  ) : null}
                </Link>
            );
          })}
        </nav>

        <div className={cn("border-t p-4", collapsed && "px-3")}>
          <div
            className={cn(
              "rounded-lg bg-slate-50 transition-all duration-300 ease-out",
              collapsed ? "flex justify-center p-3" : "p-4"
            )}
          >
            {collapsed ? (
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                71%
              </span>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">Agency health</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  81% pipeline momentum with 4 releases in finance review.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
