import { ActivityFeed } from "@/components/activity-feed";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { getAgencySnapshot } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const [snapshot, session] = await Promise.all([
    getAgencySnapshot(),
    requireRole("manager")
  ]);

  const currentUser = {
    id: session.user.id,
    name: session.user.name ?? "AlignOps User",
    email: session.user.email ?? "team@alignops.dev",
    image: session.user.image ?? null,
    role: session.user.role,
    avatar: session.user.avatar,
    active: true
  };

  return (
    <AppShell currentUser={currentUser} role="manager" active="activity" title="Activity management">
      <ActivityFeed activities={snapshot.activities} users={snapshot.users} />
    </AppShell>
  );
}
