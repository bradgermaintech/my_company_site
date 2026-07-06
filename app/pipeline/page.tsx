import { BriefcaseBusiness, CalendarCheck, CreditCard, PackageCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ApplicationCrudWorkbench } from "@/components/application-crud-workbench";
import { PipelineChart } from "@/components/pipeline-chart";
import { StatCard } from "@/components/stat-card";
import { requireSession } from "@/lib/auth";
import { pipelineStatuses } from "@/lib/constants";
import { getAgencySnapshot } from "@/lib/server-data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
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
  const pipelineData = pipelineStatuses.map((status) => ({
    name: status,
    value: snapshot.applications.filter((application) => application.status === status).length
  }));
  const revenuePipeline = snapshot.releases.reduce((total, release) => total + release.amount, 0);

  return (
    <AppShell currentUser={currentUser} role={session.user.role} active="pipeline" title="Shared application pipeline">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Applications" value={snapshot.applications.length.toString()} icon={BriefcaseBusiness} tone="blue" />
        <StatCard title="Interviews active" value={snapshot.interviews.length.toString()} icon={CalendarCheck} tone="teal" />
        <StatCard title="Releases in motion" value={snapshot.releases.length.toString()} icon={PackageCheck} tone="amber" />
        <StatCard title="Revenue pipeline" value={formatCurrency(revenuePipeline)} icon={CreditCard} tone="slate" />
      </section>
      <PipelineChart data={pipelineData} />
      <ApplicationCrudWorkbench
        currentUser={currentUser}
        initialApplications={snapshot.applications}
        users={snapshot.users}
      />
    </AppShell>
  );
}
