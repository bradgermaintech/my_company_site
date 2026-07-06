"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  BriefcaseBusiness,
  CalendarCheck,
  CircleDollarSign,
  Percent,
  TrendingUp
} from "lucide-react";
import { PipelineChart } from "@/components/pipeline-chart";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { pipelineStatuses } from "@/lib/constants";
import {
  buildConversionSeries,
  buildWeeklyBidderSeries,
  calculatePassRate,
  calculateResponseRate,
  calculateShowRate
} from "@/lib/dashboard-metrics";
import type { Interview, JobApplication, Release, User } from "@/lib/models";
import { formatCurrency } from "@/lib/utils";

type AgencyAnalyticsDashboardProps = {
  applications: JobApplication[];
  interviews: Interview[];
  releases: Release[];
  users: User[];
};

export function AgencyAnalyticsDashboard({
  applications,
  interviews,
  releases,
  users
}: AgencyAnalyticsDashboardProps) {
  const statusData = pipelineStatuses.map((status) => ({
    name: status,
    value: applications.filter((application) => application.status === status).length
  }));
  const weeklyData = buildWeeklyBidderSeries(applications, 8);
  const conversionData = buildConversionSeries(applications);
  const responseRate = calculateResponseRate(applications);
  const passRate = calculatePassRate(interviews);
  const showRate = calculateShowRate(interviews);
  const bookedInterviews = interviews.length;
  const approvedRevenue = releases
    .filter((release) => release.status === "approved" || release.status === "paid")
    .reduce((total, release) => total + release.amount, 0);
  const activeMembers = users.filter((user) => user.active && user.role !== "admin").length;
  const offerCount = applications.filter((application) => application.status === "Offer").length;
  const rejectedCount = applications.filter((application) => application.status === "Rejected").length;
  const rejectionRate = applications.length
    ? Math.round((rejectedCount / applications.length) * 100)
    : 0;

  const stageHealth = conversionData.map((item) => ({
    ...item,
    status:
      item.value >= 50
        ? ("approved" as const)
        : item.value >= 20
          ? ("pending" as const)
          : ("not-ready" as const)
  }));
  const workload = users
    .filter((user) => user.role !== "admin")
    .map((user) => ({
      user,
      records: applications.filter((application) => {
        if (user.role === "bidder") {
          return application.bidderId === user.id;
        }
        if (user.role === "caller") {
          return application.callerId === user.id;
        }
        return application.developerId === user.id;
      }).length
    }))
    .sort((left, right) => right.records - left.records)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Response rate" value={`${responseRate}%`} change="Bid to reply signal" icon={Percent} tone="teal" />
        <StatCard title="Show rate" value={`${showRate}%`} change={`${bookedInterviews} booked`} icon={CalendarCheck} tone="blue" />
        <StatCard title="Interview pass" value={`${passRate}%`} change="Passed outcomes" icon={TrendingUp} tone="amber" />
        <StatCard title="Approved revenue" value={formatCurrency(approvedRevenue)} change={`${offerCount} offers`} icon={CircleDollarSign} tone="teal" />
        <StatCard title="Active delivery team" value={activeMembers.toString()} change="Non-admin members" icon={BriefcaseBusiness} tone="slate" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PipelineChart title="Pipeline composition" data={statusData} type="pie" />
        <Card>
          <CardHeader>
            <CardTitle>Eight-week application momentum</CardTitle>
            <CardDescription>Bids and responses by application week.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "rgba(37, 99, 235, 0.08)" }} />
                  <Bar dataKey="bids" fill="#2563eb" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="responses" fill="#14b8a6" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Conversion funnel</CardTitle>
            <CardDescription>Where applications convert from response to offer.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis unit="%" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    isAnimationActive={false}
                    dot={{ r: 5, fill: "#f59e0b", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating insights</CardTitle>
            <CardDescription>Signals that should drive the next management action.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {stageHealth.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
                <div>
                  <p className="font-semibold text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value}% conversion</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="font-semibold text-foreground">Rejection pressure</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {rejectionRate}% of tracked applications are rejected. Review bid targeting when this rises above the response trend.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Workload concentration</CardTitle>
          <CardDescription>Top owners by active application load.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {workload.map(({ user, records }) => (
            <div key={user.id} className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {user.avatar}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
                </div>
              </div>
              <p className="mt-4 text-2xl font-semibold text-foreground">{records}</p>
              <p className="text-sm text-muted-foreground">owned records</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
