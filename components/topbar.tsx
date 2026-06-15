import { Bell, Search } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { roleLabels } from "@/lib/constants";
import type { User, UserRole } from "@/lib/models";

type TopbarProps = {
  currentUser: User | null;
  role: UserRole;
  title: string;
};

export function Topbar({ currentUser, role, title }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="flex min-h-16 flex-col gap-3 px-4 py-3 lg:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {roleLabels[role]} workspace
          </p>
          <h1 className="text-xl font-bold tracking-normal text-foreground">
            {title}
          </h1>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search jobs, companies, notes" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Access
            </span>
            <span className="text-sm font-semibold text-foreground">
              {roleLabels[role]}
            </span>
          </div>
          <ThemeToggle compact />
          <Button variant="outline" size="icon" aria-label="Notifications">
            <Bell className="size-4" aria-hidden="true" />
          </Button>
          <SignOutButton />
          <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
              {currentUser?.avatar ?? "PO"}
            </span>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-semibold">{currentUser?.name ?? "Pipeline User"}</p>
              <p className="truncate text-xs text-muted-foreground">{currentUser?.email ?? "team@pipelineos.dev"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
