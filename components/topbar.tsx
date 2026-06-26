 
"use client";

import { Bell, HelpCircle, Search, X } from "lucide-react";
import { useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { GettingStartedGuide } from "@/components/getting-started-guide";
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
 
  const [helpOpen, setHelpOpen] = useState(false);

 
  return (
    <>
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
            <Button
              variant="outline"
              size="icon"
              aria-label="Help and getting started"
              onClick={() => setHelpOpen(true)}
            >
              <HelpCircle className="size-4" aria-hidden="true" />
            </Button>
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

      {helpOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-8 flex w-full max-w-5xl flex-col rounded-2xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Help</p>
                <p className="text-sm text-muted-foreground">
                  Guided onboarding and workflow reference
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setHelpOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto p-5">
              <GettingStartedGuide role={role} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
