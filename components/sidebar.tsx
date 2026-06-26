"use client";

import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Settings,
  Shield,
  UsersRound
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

type SidebarProps = {
  active: string;
  collapsed: boolean;
  onToggle: () => void;
<<<<<<< HEAD
  role: UserRole;
=======
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
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
  { label: "Team", href: "/team", icon: UsersRound, key: "team" },
  { label: "Payments", href: "/payments", icon: CreditCard, key: "payments" },
  { label: "Settings", href: "/settings", icon: Settings, key: "settings" }
];

<<<<<<< HEAD
export function Sidebar({ active, collapsed, onToggle, role }: SidebarProps) {
  const items = role === "admin"
    ? [
        ...navItems.slice(0, 6),
        { label: "Users", href: "/users", icon: Shield, key: "users" },
        navItems[6]
      ]
    : navItems;

=======
export function Sidebar({ active, collapsed, onToggle }: SidebarProps) {
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
  return (
    <aside
      className={cn(
        "relative hidden min-h-screen shrink-0 border-r bg-white transition-[width] duration-300 ease-out lg:block",
        collapsed ? "w-[92px]" : "w-72"
      )}
    >
<<<<<<< HEAD
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

=======
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

      <div className="sticky top-0 flex h-screen flex-col">
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
        <Link
          href="/"
          className={cn(
            "flex h-16 items-center border-b transition-[padding,gap] duration-300 ease-out",
            collapsed ? "justify-center px-3" : "gap-3 px-6"
          )}
        >
<<<<<<< HEAD
          <BrandLogo collapsed={collapsed} />
=======
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            PO
          </span>
          <span
            className={cn(
              "overflow-hidden text-lg font-bold tracking-normal transition-all duration-300 ease-out",
              collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"
            )}
          >
            PipelineOS
          </span>
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
        </Link>

        <nav className="flex flex-1 flex-col gap-1 px-4 py-5">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-md py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 ease-out hover:bg-muted hover:text-foreground",
                  collapsed ? "justify-center px-2" : "gap-3 px-3",
                  active === item.key &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                    collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
                  )}
                >
                  {item.label}
                </span>
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
                  71% pipeline momentum with 4 releases in finance review.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
