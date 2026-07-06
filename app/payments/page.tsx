import { CreditCard, PackageCheck, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ReleasePaymentTable } from "@/components/release-payment-table";
import { StatCard } from "@/components/stat-card";
import { requireSession } from "@/lib/auth";
import { getAgencySnapshot } from "@/lib/server-data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
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

  const pendingAmount = snapshot.releases
    .filter((release) => release.status === "pending")
    .reduce((total, release) => total + release.amount, 0);

  const approvedAmount = snapshot.releases
    .filter((release) => release.status === "approved")
    .reduce((total, release) => total + release.amount, 0);

  const paidAmount = snapshot.releases
    .filter((release) => release.status === "paid")
    .reduce((total, release) => total + release.amount, 0);

  return (
    <AppShell currentUser={currentUser} role={session.user.role} active="payments" title="Release and payment operations">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Pending releases" value={formatCurrency(pendingAmount)} icon={PackageCheck} tone="amber" />
        <StatCard title="Approved payments" value={formatCurrency(approvedAmount)} icon={CreditCard} tone="teal" />
        <StatCard title="Paid out" value={formatCurrency(paidAmount)} icon={Wallet} tone="slate" />
      </section>
      <ReleasePaymentTable
        applications={snapshot.applications}
        releases={snapshot.releases}
        users={snapshot.users}
      />
    </AppShell>
  );
}
