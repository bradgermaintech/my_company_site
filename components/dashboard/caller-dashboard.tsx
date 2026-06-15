import { CalendarCheck, ClipboardCheck, PhoneCall, RotateCcw } from "lucide-react";
import { CalendarWorkstation } from "@/components/calendar-workstation";
import { StatCard } from "@/components/stat-card";
import { ApplicationTable } from "@/components/application-table";
import type { Interview, JobApplication, User } from "@/lib/models";

type CallerDashboardProps = {
  applications: JobApplication[];
  interviews: Interview[];
  userId: string;
  users: User[];
};

export function CallerDashboard({
  applications,
  interviews,
  userId,
  users
}: CallerDashboardProps) {
  const callerApplications = applications.filter((application) => application.callerId === userId);
  const callerInterviews = interviews.filter((interview) => interview.callerId === userId);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Interviews booked" value={callerInterviews.length.toString()} change="+2 today" icon={CalendarCheck} tone="blue" />
        <StatCard title="Show rate" value="92%" icon={PhoneCall} tone="teal" />
        <StatCard title="Pass rate" value="64%" icon={ClipboardCheck} tone="amber" />
        <StatCard title="Pending follow-ups" value="7" icon={RotateCcw} tone="slate" />
      </section>

      <CalendarWorkstation
        applications={applications}
        currentCallerId={userId}
        initialInterviews={callerInterviews}
        users={users}
      />
      <ApplicationTable data={callerApplications} users={users} title="Caller-linked applications" />
    </div>
  );
}
