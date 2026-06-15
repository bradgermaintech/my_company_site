import { AppShell } from "@/components/app-shell";
import { DeveloperDashboard } from "@/components/dashboard/developer-dashboard";
import { requireSession } from "@/lib/auth";
import { getAgencySnapshot } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const [snapshot, session] = await Promise.all([
    getAgencySnapshot(),
    requireSession()
  ]);

  const currentUser = {
    id: session.user.id,
    name: session.user.name ?? "Pipeline User",
    email: session.user.email ?? "team@pipelineos.dev",
    image: session.user.image ?? null,
    role: session.user.role,
    avatar: session.user.avatar,
    active: true
  };

  return (
    <AppShell currentUser={currentUser} role={session.user.role} active="team" title="Team delivery and workflow">
      <DeveloperDashboard
        applications={snapshot.applications}
        developerId={currentUser.id}
        developerTasks={snapshot.developerTasks}
        interviews={snapshot.interviews}
      />
    </AppShell>
  );
}
