import { AppShell } from "@/components/app-shell";
import { DeveloperDashboard } from "@/components/dashboard/developer-dashboard";

export default function DeveloperDashboardPage() {
  return (
    <AppShell role="developer" active="dashboard" title="Delivery and task board">
      <DeveloperDashboard />
    </AppShell>
  );
}
