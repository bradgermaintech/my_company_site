import { AppShell } from "@/components/app-shell";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { requireRole } from "@/lib/auth";
import { getAgencySnapshot } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [snapshot, session] = await Promise.all([
    getAgencySnapshot(),
    requireRole("admin")
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
    <AppShell currentUser={currentUser} role="admin" active="dashboard" title="Agency command center">
      <AdminDashboard
        activities={snapshot.activities}
        applications={snapshot.applications}
        developerTasks={snapshot.developerTasks}
        interviews={snapshot.interviews}
        releases={snapshot.releases}
        users={snapshot.users}
      />
    </AppShell>
  );
}
