import { AppShell } from "@/components/app-shell";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default function AdminDashboardPage() {
  return (
    <AppShell role="admin" active="dashboard" title="Agency command center">
      <AdminDashboard />
    </AppShell>
  );
}
