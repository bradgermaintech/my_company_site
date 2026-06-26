import { AppShell } from "@/components/app-shell";
import { BidderDashboard } from "@/components/dashboard/bidder-dashboard";
import { requireRole } from "@/lib/auth";
import { getAgencySnapshot } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function BidderDashboardPage() {
  const [snapshot, session] = await Promise.all([
    getAgencySnapshot(),
    requireRole("bidder")
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
    <AppShell currentUser={currentUser} role="bidder" active="dashboard" title="Bidding and resume workspace">
      <BidderDashboard
        applications={snapshot.applications}
<<<<<<< HEAD
        interviews={snapshot.interviews}
=======
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
        resumeTailors={snapshot.resumeTailors}
        userId={currentUser.id}
        users={snapshot.users}
      />
    </AppShell>
  );
}
