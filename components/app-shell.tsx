"use client";

import { useEffect, useState } from "react";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import type { User, UserRole } from "@/lib/models";

type AppShellProps = {
  role: UserRole;
  active: string;
  title: string;
  currentUser: User | null;
  children: React.ReactNode;
};

const storageKey = "pipelineos-sidebar-collapsed";

export function AppShell({ role, active, title, currentUser, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(storageKey, String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar active={active} collapsed={collapsed} onToggle={toggleSidebar} role={role} />
        <div className="min-w-0 flex-1">
          <Topbar currentUser={currentUser} role={role} title={title} />
          <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
