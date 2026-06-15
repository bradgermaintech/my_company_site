import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  PanelLeftClose,
  Settings,
  UsersRound
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
type SidebarProps = {
  active: string;
  collapsed: boolean;
};

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  key: string;
  href: string;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    key: "dashboard"
  },
  {
    label: "Pipeline",
    href: "/pipeline",
    icon: BriefcaseBusiness,
    key: "pipeline"
  },
  {
    label: "Interviews",
    href: "/dashboard/caller",
    icon: CalendarClock,
    key: "interviews"
  },
  {
    label: "Analytics",
    href: "/dashboard/admin",
    icon: BarChart3,
    key: "analytics"
  },
  {
    label: "Team",
    href: "/dashboard/developer",
    icon: UsersRound,
    key: "team"
  },
  {
    label: "Payments",
    href: "/dashboard/admin",
    icon: CreditCard,
    key: "payments"
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    key: "settings"
  }
];

export function Sidebar({ active, collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden min-h-screen shrink-0 border-r bg-white transition-[width] duration-300 ease-out lg:block",
        collapsed ? "w-[92px]" : "w-72"
      )}
    >
      <div className="sticky top-0 flex h-screen flex-col">
        <Link
          href="/"
          className={cn(
            "flex h-16 items-center border-b transition-[padding,gap] duration-300 ease-out",
            collapsed ? "justify-center px-3" : "gap-3 px-6"
          )}
        >
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
        </Link>

        <nav className="flex flex-1 flex-col gap-1 px-4 py-5">
          {navItems.map((item) => {
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
          <div className={cn("mb-4 rounded-lg border bg-slate-50", collapsed ? "p-2" : "p-4")}>
            {collapsed ? (
              <div className="flex justify-center">
                <ThemeToggle compact />
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Theme
                </p>
                <div className="mt-3">
                  <ThemeToggle />
                </div>
              </>
            )}
          </div>

          <div
            className={cn(
              "rounded-lg bg-slate-50 transition-all duration-300 ease-out",
              collapsed ? "flex justify-center p-3" : "p-4"
            )}
          >
            {collapsed ? (
              <PanelLeftClose className="size-4 text-muted-foreground" aria-hidden="true" />
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
