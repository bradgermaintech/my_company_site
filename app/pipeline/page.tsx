import { BriefcaseBusiness, CalendarCheck, CreditCard, PackageCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ApplicationTable } from "@/components/application-table";
import { PipelineChart } from "@/components/pipeline-chart";
import { StatCard } from "@/components/stat-card";
import { applications, pipelineStatuses, releases } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default function PipelinePage() {
  const pipelineData = pipelineStatuses.map((status) => ({
    name: status,
    value: applications.filter((application) => application.status === status).length
  }));
  const revenuePipeline = releases.reduce((total, release) => total + release.amount, 0);

  return (
    <AppShell role="admin" active="pipeline" title="Shared application pipeline">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Applications" value={applications.length.toString()} icon={BriefcaseBusiness} tone="blue" />
        <StatCard title="Interviews active" value="4" icon={CalendarCheck} tone="teal" />
        <StatCard title="Releases in motion" value={releases.length.toString()} icon={PackageCheck} tone="amber" />
        <StatCard title="Revenue pipeline" value={formatCurrency(revenuePipeline)} icon={CreditCard} tone="slate" />
      </section>
      <PipelineChart data={pipelineData} />
      <ApplicationTable data={applications} title="Shared agency application and job pipeline" />
    </AppShell>
  );
}
