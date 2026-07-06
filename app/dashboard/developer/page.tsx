import { AppShell } from "@/components/app-shell";
import { DeveloperDashboard } from "@/components/dashboard/developer-dashboard";
import { requireRole } from "@/lib/auth";
import { getAgencySnapshot } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function DeveloperDashboardPage() {
  const [snapshot, session] = await Promise.all([
    getAgencySnapshot(),
    requireRole("developer")
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
    <AppShell currentUser={currentUser} role="developer" active="dashboard" title="Delivery and task board">
      <DeveloperDashboard
        applications={snapshot.applications}
        developerId={currentUser.id}
        developerTasks={snapshot.developerTasks}
        interviews={snapshot.interviews}
      />
    </AppShell>
  );
}
