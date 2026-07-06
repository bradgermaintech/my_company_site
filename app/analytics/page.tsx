import { AppShell } from "@/components/app-shell";
import { AgencyAnalyticsDashboard } from "@/components/dashboard/agency-analytics-dashboard";
import { requireSession } from "@/lib/auth";
import { getAgencySnapshot } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [snapshot, session] = await Promise.all([
    getAgencySnapshot(),
    requireSession()
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
    <AppShell currentUser={currentUser} role={session.user.role} active="analytics" title="Agency analytics and performance">
      <AgencyAnalyticsDashboard
        applications={snapshot.applications}
        interviews={snapshot.interviews}
        releases={snapshot.releases}
        users={snapshot.users}
      />
    </AppShell>
  );
}
