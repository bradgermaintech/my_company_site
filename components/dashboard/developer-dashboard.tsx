import { CheckCircle2, Clock3, KanbanSquare, PackageCheck } from "lucide-react";
import { DeveloperTaskBoard } from "@/components/developer-task-board";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { DeveloperTask, Interview, JobApplication } from "@/lib/models";
import { formatDate } from "@/lib/utils";

type DeveloperDashboardProps = {
  applications: JobApplication[];
  developerId: string;
  developerTasks: DeveloperTask[];
  interviews: Interview[];
};

export function DeveloperDashboard({
  applications,
  developerId,
  developerTasks,
  interviews
}: DeveloperDashboardProps) {
  const assignedApplications = applications.filter((application) => application.developerId === developerId);
  const assignedTasks = developerTasks.filter((task) => task.developerId === developerId);
  const reviewTasks = assignedTasks.filter((task) => task.status === "review").length;
  const doneTasks = assignedTasks.filter((task) => task.status === "done").length;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Assigned projects" value={assignedApplications.length.toString()} icon={KanbanSquare} tone="blue" />
        <StatCard title="Open tasks" value={assignedTasks.filter((task) => task.status !== "done").length.toString()} icon={Clock3} tone="amber" />
        <StatCard title="In review" value={reviewTasks.toString()} icon={PackageCheck} tone="teal" />
        <StatCard title="Completed" value={doneTasks.toString()} icon={CheckCircle2} tone="slate" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Assigned project context</CardTitle>
          <CardDescription>
            Job, interview, and delivery expectations the developer needs before client calls.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {assignedApplications.map((application) => {
            const linkedInterview = interviews.find(
              (interview) => interview.applicationId === application.id
            );

            return (
              <div key={application.id} className="rounded-lg border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{application.company}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {application.jobTitle}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
                <div className="mt-4 rounded-md bg-white p-3 text-xs leading-5 text-muted-foreground">
                  {application.notes}
                </div>
                <p className="mt-3 text-xs font-medium text-slate-700">
                  Deadline: {linkedInterview ? formatDate(linkedInterview.startTime) : "Waiting on schedule"}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <DeveloperTaskBoard
        applications={applications}
        developerId={developerId}
        initialTasks={assignedTasks}
      />
    </div>
  );
}
