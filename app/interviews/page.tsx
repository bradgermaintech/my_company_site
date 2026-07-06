import { AppShell } from "@/components/app-shell";
import { CallerDashboard } from "@/components/dashboard/caller-dashboard";
import { requireSession } from "@/lib/auth";
import { getAgencySnapshot } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
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
    <AppShell currentUser={currentUser} role={session.user.role} active="interviews" title="Interview calendar workstation">
      <CallerDashboard
 
        activities={snapshot.activities}
        applications={snapshot.applications}
        currentUser={currentUser}
        interviews={snapshot.interviews}
        users={snapshot.users}
      />
    </AppShell>
  );
}
