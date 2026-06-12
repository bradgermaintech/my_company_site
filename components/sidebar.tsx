import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  Settings,
  UsersRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/models";

type SidebarProps = {
  active: string;
  role: UserRole;
};

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  key: string;
} & (
  | { href: string; hrefByRole?: never }
  | { href?: never; hrefByRole: Record<UserRole, string> }
);

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    hrefByRole: {
      admin: "/dashboard/admin",
      bidder: "/dashboard/bidder",
      caller: "/dashboard/caller",
      developer: "/dashboard/developer"
    },
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

export function Sidebar({ active, role }: SidebarProps) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <Link href="/" className="flex h-16 items-center gap-3 border-b px-6">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            PO
          </span>
          <span className="text-lg font-bold tracking-normal">PipelineOS</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 px-4 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const href = item.hrefByRole ? item.hrefByRole[role] : item.href;

            return (
              <Link
                key={item.key}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active === item.key && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold text-foreground">Agency health</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              71% pipeline momentum with 4 releases in finance review.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
