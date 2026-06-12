import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import type { UserRole } from "@/lib/models";

type AppShellProps = {
  role: UserRole;
  active: string;
  title: string;
  children: React.ReactNode;
};

export function AppShell({ role, active, title, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar active={active} role={role} />
        <div className="min-w-0 flex-1">
          <Topbar role={role} title={title} />
          <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
