"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  CalendarCheck,
  CreditCard,
  PackageCheck,
  Percent,
  UsersRound
} from "lucide-react";
import { ApplicationTable } from "@/components/application-table";
import { PipelineChart } from "@/components/pipeline-chart";
import { ReleasePaymentTable } from "@/components/release-payment-table";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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

type ManagerDashboardProps = {
  applications: JobApplication[];
  developerTasks: DeveloperTask[];
  interviews: Interview[];
  releases: Release[];
  users: User[];
};

type ManagerFilterState = {
  endDate: string;
  jobTitle: string;
  range: string;
  startDate: string;
  status: string;
  userId: string;
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createDefaultFilters(): ManagerFilterState {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 90);

  return {
    endDate: toDateInputValue(end),
    jobTitle: "all",
    range: "90",
    startDate: toDateInputValue(start),
    status: "all",
    userId: "all"
  };
}

export function ManagerDashboard({
  applications,
  developerTasks,
  interviews,
  releases,
  users
}: ManagerDashboardProps) {
  const searchParams = useSearchParams();
  const dashboardSearch = (searchParams.get("q") ?? "").trim().toLowerCase();
  const [filters, setFilters] = useState<ManagerFilterState>(() => createDefaultFilters());
  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const date = new Date(application.date);
      const start = new Date(`${filters.startDate}T00:00:00`);
      const end = new Date(`${filters.endDate}T23:59:59`);
      const bidder = users.find((user) => user.id === application.bidderId);
      const caller = users.find((user) => user.id === application.callerId);
      const developer = users.find((user) => user.id === application.developerId);
      const searchable = [
        application.jobTitle,
        application.company,
        application.notes,
        application.resumeVersion,
        application.status,
        bidder?.name,
        bidder?.email,
        caller?.name,
        caller?.email,
        developer?.name,
        developer?.email
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        date >= start &&
        date <= end &&
        (filters.userId === "all" ||
          application.bidderId === filters.userId ||
          application.callerId === filters.userId ||
          application.developerId === filters.userId) &&
        (filters.jobTitle === "all" || application.jobTitle === filters.jobTitle) &&
        (filters.status === "all" || application.status === filters.status) &&
        (!dashboardSearch || searchable.includes(dashboardSearch))
      );
    });
  }, [applications, dashboardSearch, filters, users]);
  const filteredApplicationIds = useMemo(
    () => new Set(filteredApplications.map((application) => application.id)),
    [filteredApplications]
  );
  const filteredInterviews = useMemo(
    () => interviews.filter((interview) => filteredApplicationIds.has(interview.applicationId)),
    [filteredApplicationIds, interviews]
  );
  const filteredReleases = useMemo(
    () => releases.filter((release) => filteredApplicationIds.has(release.applicationId)),
    [filteredApplicationIds, releases]
  );
  const pipelineData = pipelineStatuses.map((status) => ({
    name: status,
    value: filteredApplications.filter((application) => application.status === status).length
  }));

  const responseRate = calculateResponseRate(filteredApplications);
  const applicationsThisWeek = countApplicationsInLatestWeek(filteredApplications);
  const interviewsThisWeek = countInterviewsInLatestWeek(filteredInterviews);
  const respondedCount = filteredApplications.filter(
    (application) => application.status !== "Bid" && application.status !== "Rejected"
  ).length;

  const approvedPayments = filteredReleases
    .filter((release) => release.status === "approved" || release.status === "paid")
    .reduce((total, release) => total + release.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
 
        <StatCard title="Total bids" value={filteredApplications.length.toString()} change={`${applicationsThisWeek} in latest week`} icon={BriefcaseBusiness} tone="blue" />
        <StatCard title="Response rate" value={`${responseRate}%`} change={`${respondedCount} responded`} icon={Percent} tone="teal" />
        <StatCard title="Interviews" value={filteredInterviews.length.toString()} change={`${interviewsThisWeek} in latest week`} icon={CalendarCheck} tone="amber" />
        <StatCard
          title="Active developers"
          value={users.filter((user) => user.role === "developer" && user.active).length.toString()}
          icon={UsersRound}
          tone="slate"
        />
        <StatCard title="Releases pending" value={filteredReleases.filter((release) => release.status === "pending").length.toString()} icon={PackageCheck} tone="amber" />
        <StatCard title="Approved payments" value={formatCurrency(approvedPayments)} icon={CreditCard} tone="teal" />
      </section>

      <ManagerFilters
        applications={applications}
        filters={filters}
        onChange={setFilters}
        users={users}
      />

      <section className="grid gap-6">
        <PipelineChart data={pipelineData} />
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1fr_0.9fr]">
        <TeamPerformanceTable applications={filteredApplications} developerTasks={developerTasks} users={users} />
        <ReleasePaymentTable applications={filteredApplications} releases={filteredReleases} users={users} />
      </section>

      <ApplicationTable data={filteredApplications} users={users} title="Agency application pipeline" />
    </div>
  );
}

function ManagerFilters({
  applications,
  filters,
  onChange,
  users
}: {
  applications: JobApplication[];
  filters: ManagerFilterState;
  onChange: (filters: ManagerFilterState) => void;
  users: User[];
}) {
  const jobTitles = useMemo(
    () => Array.from(new Set(applications.map((application) => application.jobTitle))).sort(),
    [applications]
  );

  function patchFilters(nextFilters: Partial<ManagerFilterState>) {
    onChange({
      ...filters,
      ...nextFilters
    });
  }

  function applyQuickRange(value: string) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - Number(value));
    patchFilters({
      endDate: toDateInputValue(end),
      range: value,
      startDate: toDateInputValue(start)
    });
  }

  function resetFilters() {
    onChange(createDefaultFilters());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agency filters</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-line md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden="true" />
            Date range
          </div>
          <Select
            aria-label="Quick date range"
            value={filters.range}
            onChange={(event) => applyQuickRange(event.target.value)}
            className="md:w-[140px]"
          >
            <option value="custom">Custom</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 180 days</option>
          </Select>
          <Input
            aria-label="Start date"
            type="date"
            value={filters.startDate}
            onChange={(event) => patchFilters({ range: "custom", startDate: event.target.value })}
            className="md:w-[150px]"
          />
          <Input
            aria-label="End date"
            type="date"
            value={filters.endDate}
            onChange={(event) => patchFilters({ range: "custom", endDate: event.target.value })}
            className="md:w-[150px]"
          />
        </div>
        <Select
          aria-label="User filter"
          value={filters.userId}
          onChange={(event) => patchFilters({ userId: event.target.value })}
          className="xl:w-[180px]"
        >
          <option value="all">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Job title filter"
          value={filters.jobTitle}
          onChange={(event) => patchFilters({ jobTitle: event.target.value })}
          className="xl:w-[230px]"
        >
          <option value="all">All job titles</option>
          {jobTitles.map((jobTitle) => (
            <option key={jobTitle} value={jobTitle}>
              {jobTitle}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Status filter"
          value={filters.status}
          onChange={(event) => patchFilters({ status: event.target.value })}
          className="xl:w-[180px]"
        >
          <option value="all">All statuses</option>
          {pipelineStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Button type="button" variant="secondary" onClick={resetFilters}>
          Reset
        </Button>
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
    .filter((user) => user.role !== "manager")
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
