import { AppShell } from "@/components/app-shell";
import { CallerDashboard } from "@/components/dashboard/caller-dashboard";

export default function CallerDashboardPage() {
  return (
    <AppShell role="caller" active="dashboard" title="Interview calendar workstation">
      <CallerDashboard />
    </AppShell>
  );
}
