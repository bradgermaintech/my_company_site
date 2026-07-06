"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarCheck,
  CreditCard,
  PackageCheck,
  Percent,
  UsersRound
} from "lucide-react";
import { ApplicationTable } from "@/components/application-table";
import { DateRangePicker } from "@/components/date-range-picker";
import { PipelineChart } from "@/components/pipeline-chart";
import { ReleasePaymentTable } from "@/components/release-payment-table";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { pipelineStatuses } from "@/lib/constants";
 
import {
  calculateResponseRate,
  countApplicationsInLatestWeek,
  countInterviewsInLatestWeek
} from "@/lib/dashboard-metrics";
 
import type { DeveloperTask, Interview, JobApplication, Release, User } from "@/lib/models";
import { formatCurrency } from "@/lib/utils";

type AdminDashboardProps = {
  applications: JobApplication[];
  developerTasks: DeveloperTask[];
  interviews: Interview[];
  releases: Release[];
  users: User[];
};

export function AdminDashboard({
  applications,
  developerTasks,
  interviews,
  releases,
  users
}: AdminDashboardProps) {
  const pipelineData = pipelineStatuses.map((status) => ({
    name: status,
    value: applications.filter((application) => application.status === status).length
  }));

  const responseRate = calculateResponseRate(applications);
  const applicationsThisWeek = countApplicationsInLatestWeek(applications);
  const interviewsThisWeek = countInterviewsInLatestWeek(interviews);
  const respondedCount = applications.filter(
    (application) => application.status !== "Bid" && application.status !== "Rejected"
  ).length;

  const approvedPayments = releases
    .filter((release) => release.status === "approved" || release.status === "paid")
    .reduce((total, release) => total + release.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
 
        <StatCard title="Total bids" value={applications.length.toString()} change={`${applicationsThisWeek} in latest week`} icon={BriefcaseBusiness} tone="blue" />
        <StatCard title="Response rate" value={`${responseRate}%`} change={`${respondedCount} responded`} icon={Percent} tone="teal" />
        <StatCard title="Interviews" value={interviews.length.toString()} change={`${interviewsThisWeek} in latest week`} icon={CalendarCheck} tone="amber" />
        <StatCard
          title="Active developers"
          value={users.filter((user) => user.role === "developer" && user.active).length.toString()}
          icon={UsersRound}
          tone="slate"
        />
        <StatCard title="Releases pending" value={releases.filter((release) => release.status === "pending").length.toString()} icon={PackageCheck} tone="amber" />
        <StatCard title="Approved payments" value={formatCurrency(approvedPayments)} icon={CreditCard} tone="teal" />
      </section>

      <AdminFilters applications={applications} users={users} />

      <section className="grid gap-6">
        <PipelineChart data={pipelineData} />
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1fr_0.9fr]">
        <TeamPerformanceTable applications={applications} developerTasks={developerTasks} users={users} />
        <ReleasePaymentTable applications={applications} releases={releases} users={users} />
      </section>

      <ApplicationTable data={applications} users={users} title="Agency application pipeline" />
    </div>
  );
}

function AdminFilters({
  applications,
  users
}: {
  applications: JobApplication[];
  users: User[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agency filters</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
        <DateRangePicker />
        <Select aria-label="User filter" defaultValue="all" className="xl:w-[180px]">
          <option value="all">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Job title filter" defaultValue="all" className="xl:w-[230px]">
          <option value="all">All job titles</option>
          {applications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.jobTitle}
            </option>
          ))}
        </Select>
        <Select aria-label="Status filter" defaultValue="all" className="xl:w-[180px]">
          <option value="all">All statuses</option>
          {pipelineStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </CardContent>
    </Card>
  );
}

function TeamPerformanceTable({
  applications,
  developerTasks,
  users
}: {
  applications: JobApplication[];
  developerTasks: DeveloperTask[];
  users: User[];
}) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    member: searchParams.get("q") ?? "",
    role: "",
    records: "",
    tasks: "",
    offers: "",
    health: ""
  });
  const rows = useMemo(() => users
    .filter((user) => user.role !== "admin")
    .map((user) => {
      const ownedApplications = applications.filter((application) => {
        if (user.role === "bidder") {
          return application.bidderId === user.id;
        }
        if (user.role === "caller") {
          return application.callerId === user.id;
        }
        return application.developerId === user.id;
      });

      const tasks = developerTasks.filter((task) => task.developerId === user.id);
      const offers = ownedApplications.filter((application) => application.status === "Offer").length;

      return {
        user,
        ownedApplications,
        tasks,
        offers
      };
    })
    .filter(({ user, ownedApplications, tasks, offers }) => {
      const health = ownedApplications.length > 1 ? "approved" : "pending";
      return (
        [user.name, user.email].join(" ").toLowerCase().includes(filters.member.toLowerCase()) &&
        user.role.toLowerCase().includes(filters.role.toLowerCase()) &&
        ownedApplications.length.toString().includes(filters.records) &&
        tasks.length.toString().includes(filters.tasks) &&
        offers.toString().includes(filters.offers) &&
        health.includes(filters.health.toLowerCase())
      );
    }), [applications, developerTasks, filters, users]);

  function setFilter(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Offers</TableHead>
              <TableHead>Health</TableHead>
            </TableRow>
            <TableRow>
              <TableHead><Input value={filters.member} onChange={(event) => setFilter("member", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
              <TableHead><Input value={filters.role} onChange={(event) => setFilter("role", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
              <TableHead><Input value={filters.records} onChange={(event) => setFilter("records", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
              <TableHead><Input value={filters.tasks} onChange={(event) => setFilter("tasks", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
              <TableHead><Input value={filters.offers} onChange={(event) => setFilter("offers", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
              <TableHead><Input value={filters.health} onChange={(event) => setFilter("health", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ user, ownedApplications, tasks, offers }) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                      {user.avatar}
                    </span>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>{ownedApplications.length}</TableCell>
                <TableCell>{tasks.length}</TableCell>
                <TableCell>{offers}</TableCell>
                <TableCell>
                  <StatusBadge status={ownedApplications.length > 1 ? "approved" : "pending"} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No team members match the current filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
