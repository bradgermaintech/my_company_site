import { AppShell } from "@/components/app-shell";
import { BidderDashboard } from "@/components/dashboard/bidder-dashboard";

export default function BidderDashboardPage() {
  return (
    <AppShell role="bidder" active="dashboard" title="Bidding and resume workspace">
      <BidderDashboard />
    </AppShell>
  );
}
