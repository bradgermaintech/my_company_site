import { BriefcaseBusiness } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ApplicationCrudWorkbench } from "@/components/application-crud-workbench";
import { StatCard } from "@/components/stat-card";
import { requireSession } from "@/lib/auth";
import { pipelineStatuses } from "@/lib/constants";
import { getAgencySnapshot } from "@/lib/server-data";

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
  const isBidder = session.user.role === "bidder";
  const visibleApplications = isBidder
    ? snapshot.applications.filter((application) => application.bidderId === currentUser.id)
    : snapshot.applications;
  const workflowStatuses = pipelineStatuses.map((status) => ({
    name: status,
    value: visibleApplications.filter((application) => application.status === status).length
  })).filter((item) => item.value > 0 || ["Bid", "Response", "Rejected"].includes(item.name));
  const pageTitle = isBidder ? "My bidding workflow status" : "Shared application pipeline";

  return (
    <AppShell currentUser={currentUser} role={session.user.role} active="pipeline" title={pageTitle}>
      {isBidder ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {workflowStatuses.map((item) => (
            <StatCard
              key={item.name}
              title={item.name}
              value={item.value.toString()}
              icon={BriefcaseBusiness}
              tone={item.name === "Response" ? "teal" : item.name === "Rejected" ? "slate" : "blue"}
            />
          ))}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {workflowStatuses.map((item) => (
            <StatCard
              key={item.name}
              title={item.name}
              value={item.value.toString()}
              icon={BriefcaseBusiness}
              tone={item.name === "Offer" ? "teal" : item.name === "Rejected" ? "slate" : "blue"}
            />
          ))}
        </section>
      )}
      <ApplicationCrudWorkbench
        currentUser={currentUser}
        initialApplications={visibleApplications}
        users={snapshot.users}
      />
    </AppShell>
  );
}
