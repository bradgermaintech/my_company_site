import { AppShell } from "@/components/app-shell";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { requireRole } from "@/lib/auth";
import { getAgencySnapshot } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  const [snapshot, session] = await Promise.all([
    getAgencySnapshot(),
    requireRole("manager")
  ]);

  const currentUser = {
    id: session.user.id,
    name: session.user.name ?? "Pipeline User",
    email: session.user.email ?? "team@alignops.dev",
    image: session.user.image ?? null,
    role: session.user.role,
    avatar: session.user.avatar,
    active: true
  };

  return (
    <AppShell currentUser={currentUser} role="manager" active="dashboard" title="Agency command center">
      <ManagerDashboard
        applications={snapshot.applications}
        developerTasks={snapshot.developerTasks}
        interviews={snapshot.interviews}
        releases={snapshot.releases}
        users={snapshot.users}
      />
    </AppShell>
  );
}
