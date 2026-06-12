import { CalendarCheck, ClipboardCheck, PhoneCall, RotateCcw } from "lucide-react";
import { CalendarWorkstation } from "@/components/calendar-workstation";
import { StatCard } from "@/components/stat-card";
import { ApplicationTable } from "@/components/application-table";
import { applications, interviews } from "@/lib/data";

export function CallerDashboard() {
  const callerApplications = applications.filter(
    (application) => application.callerId === "user-caller-1"
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Interviews booked" value={interviews.length.toString()} change="+2 today" icon={CalendarCheck} tone="blue" />
        <StatCard title="Show rate" value="92%" icon={PhoneCall} tone="teal" />
        <StatCard title="Pass rate" value="64%" icon={ClipboardCheck} tone="amber" />
        <StatCard title="Pending follow-ups" value="7" icon={RotateCcw} tone="slate" />
      </section>

      <CalendarWorkstation />
      <ApplicationTable data={callerApplications} title="Caller-linked applications" />
    </div>
  );
}
