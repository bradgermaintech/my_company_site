import { CalendarCheck, ClipboardCheck, PhoneCall, RotateCcw } from "lucide-react";
import { CalendarWorkstation } from "@/components/calendar-workstation";
import { StatCard } from "@/components/stat-card";
import { ApplicationTable } from "@/components/application-table";
<<<<<<< HEAD
import { scopeApplicationsForRole, scopeInterviewsForRole } from "@/lib/interview-permissions";
import type { Activity, Interview, JobApplication, User } from "@/lib/models";

type CallerDashboardProps = {
  activities: Activity[];
  applications: JobApplication[];
  currentUser: User;
  interviews: Interview[];
=======
import type { Interview, JobApplication, User } from "@/lib/models";

type CallerDashboardProps = {
  applications: JobApplication[];
  interviews: Interview[];
  userId: string;
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
  users: User[];
};

export function CallerDashboard({
<<<<<<< HEAD
  activities,
  applications,
  currentUser,
  interviews,
  users
}: CallerDashboardProps) {
  const applicationsById = new Map(applications.map((application) => [application.id, application]));
  const scopedApplications = scopeApplicationsForRole(
    currentUser.role,
    currentUser.id,
    applications
  );
  const scopedInterviews = scopeInterviewsForRole(
    currentUser.role,
    currentUser.id,
    interviews,
    applicationsById
  );
  const passedCount = scopedInterviews.filter((interview) => interview.result === "passed").length;
  const scheduledCount = scopedInterviews.filter(
    (interview) => interview.result === "scheduled"
  ).length;
  const showRate = scopedInterviews.length
    ? Math.round(((scopedInterviews.length - scopedInterviews.filter((interview) => interview.result === "reschedule").length) / scopedInterviews.length) * 100)
    : 0;
  const passRate = scopedInterviews.length
    ? Math.round((passedCount / scopedInterviews.length) * 100)
    : 0;
=======
  applications,
  interviews,
  userId,
  users
}: CallerDashboardProps) {
  const callerApplications = applications.filter((application) => application.callerId === userId);
  const callerInterviews = interviews.filter((interview) => interview.callerId === userId);
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
<<<<<<< HEAD
        <StatCard title="Interviews booked" value={scopedInterviews.length.toString()} change={`${scheduledCount} scheduled`} icon={CalendarCheck} tone="blue" />
        <StatCard title="Show rate" value={`${showRate}%`} icon={PhoneCall} tone="teal" />
        <StatCard title="Pass rate" value={`${passRate}%`} icon={ClipboardCheck} tone="amber" />
        <StatCard title="Pending follow-ups" value={scopedInterviews.filter((interview) => interview.result === "reschedule").length.toString()} icon={RotateCcw} tone="slate" />
      </section>

      <CalendarWorkstation
        applications={scopedApplications}
        currentUser={currentUser}
        initialActivities={activities}
        initialInterviews={scopedInterviews}
        users={users}
      />
      <ApplicationTable data={scopedApplications} users={users} title="Interview-linked applications" />
=======
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
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
    </div>
  );
}
