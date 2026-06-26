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
import { PipelineChart } from "@/components/pipeline-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { pipelineStatuses } from "@/lib/constants";
<<<<<<< HEAD
import { buildConversionSeries, buildWeeklyBidderSeries } from "@/lib/dashboard-metrics";
=======
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
import type { JobApplication } from "@/lib/models";

type BidderAnalyticsProps = {
  applications: JobApplication[];
};

export function BidderAnalytics({ applications }: BidderAnalyticsProps) {
  const statusData = pipelineStatuses.map((status) => ({
    name: status,
    value: applications.filter((application) => application.status === status).length
  }));
  const weeklyData = buildWeeklyBidderSeries(applications);
  const conversionData = buildConversionSeries(applications);

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <PipelineChart title="Status distribution" data={statusData} type="pie" />
      <Card>
        <CardHeader>
          <CardTitle>Weekly bids</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(20, 184, 166, 0.08)" }} />
                <Bar dataKey="bids" fill="#2563eb" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="responses" fill="#14b8a6" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Conversion rates</CardTitle>
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
    </div>
  );
}
