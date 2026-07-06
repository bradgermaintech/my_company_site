 
"use client";

import { Bell, HelpCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="flex flex-col gap-3 px-4 py-3 lg:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {roleLabels[role]} workspace
            </p>
            <h1 className="text-balance text-lg font-bold tracking-normal text-foreground sm:text-xl">
              {title}
            </h1>
            </div>

            <div className="hidden items-center gap-2 xl:flex">
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
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <form className="relative min-w-0 lg:max-w-md lg:flex-1" onSubmit={submitSearch}>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search jobs, companies, notes"
              />
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:justify-end">
              <div className="flex items-center justify-between gap-3 sm:w-auto">
                <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Access
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {roleLabels[role]}
                  </span>
                </div>
                <div className="flex items-center gap-2 xl:hidden">
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
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="min-w-0 flex-1 rounded-lg border bg-card px-3 py-2 sm:max-w-[260px]">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                      {currentUser?.avatar ?? "PO"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{currentUser?.name ?? "Pipeline User"}</p>
                      <p className="truncate text-xs text-muted-foreground">{currentUser?.email ?? "team@alignops.dev"}</p>
                    </div>
                  </div>
                </div>
                <div className="xl:hidden">
                  <SignOutButton />
                </div>
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
