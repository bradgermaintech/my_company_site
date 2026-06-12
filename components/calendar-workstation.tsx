"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Clock, GripVertical } from "lucide-react";
import { InterviewModal } from "@/components/interview-modal";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { applications, getApplication, getUser, interviews as initialInterviews } from "@/lib/data";
import type { Interview } from "@/lib/models";
import { cn, formatDate } from "@/lib/utils";

type CalendarView = "month" | "week" | "day";

const stages = ["Intro", "Tech", "Culture", "Final"] as const;

export function CalendarWorkstation() {
  const [view, setView] = useState<CalendarView>("week");
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<Interview[]>(initialInterviews);

  const monthDays = useMemo(() => {
    const firstDayOffset = 1;
    return [
      ...Array.from({ length: firstDayOffset }, (_, index) => ({
        key: `blank-${index}`,
        day: null
      })),
      ...Array.from({ length: 30 }, (_, index) => ({
        key: `day-${index + 1}`,
        day: index + 1
      }))
    ];
  }, []);

  const upcoming = [...items]
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  return (
    <>
      <Card>
        <CardHeader className="gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle>Interview calendar workstation</CardTitle>
            <CardDescription>
              Schedule calls, coordinate candidates, and keep stage context close to the calendar.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["month", "week", "day"] as CalendarView[]).map((item) => (
              <Button
                key={item}
                type="button"
                variant={view === item ? "default" : "outline"}
                onClick={() => setView(item)}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </Button>
            ))}
            <Button type="button" onClick={() => setModalOpen(true)}>
              <CalendarPlus className="size-4" aria-hidden="true" />
              Add interview
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="rounded-lg border bg-slate-50 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">June 2026</p>
                <p className="text-xs text-muted-foreground">
                  {view === "month" ? "Month grid" : view === "week" ? "Week planner" : "Day agenda"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage) => (
                  <span
                    key={stage}
                    className="rounded-md border bg-white px-2 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    {stage}
                  </span>
                ))}
              </div>
            </div>

            {view === "month" ? (
              <MonthGrid days={monthDays} interviews={items} />
            ) : (
              <WeekGrid interviews={items} compact={view === "day"} />
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <PerformanceMetric label="Interviews booked" value={items.length.toString()} />
              <PerformanceMetric label="Show rate" value="92%" />
              <PerformanceMetric label="Pass rate" value="64%" />
              <PerformanceMetric label="Follow-ups" value="7" />
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h3 className="text-sm font-semibold">Upcoming interviews</h3>
              <div className="mt-4 flex flex-col gap-3">
                {upcoming.map((interview) => {
                  const application = getApplication(interview.applicationId) ?? applications[0];
                  const developer = getUser(interview.developerId);

                  return (
                    <div key={interview.id} className="rounded-lg border bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{interview.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {application.company} - {developer?.name}
                          </p>
                        </div>
                        <StatusBadge status={interview.stage} />
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {formatDate(interview.startTime)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <InterviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAdd={(interview) => setItems((current) => [interview, ...current])}
      />
    </>
  );
}

function MonthGrid({
  days,
  interviews
}: {
  days: Array<{ key: string; day: number | null }>;
  interviews: Interview[];
}) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
        <div key={day} className="px-2 text-xs font-semibold text-muted-foreground">
          {day}
        </div>
      ))}
      {days.map(({ key, day }) => {
        const dayInterviews = day
          ? interviews.filter((interview) => new Date(interview.startTime).getUTCDate() === day)
          : [];

        return (
          <div
            key={key}
            className={cn(
              "min-h-[104px] rounded-lg border bg-white p-2",
              day === null && "border-transparent bg-transparent"
            )}
          >
            {day ? <p className="text-xs font-semibold">{day}</p> : null}
            <div className="mt-2 flex flex-col gap-1">
              {dayInterviews.slice(0, 2).map((interview) => (
                <CalendarCard key={interview.id} interview={interview} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekGrid({
  interviews,
  compact
}: {
  interviews: Interview[];
  compact?: boolean;
}) {
  const visibleDays = compact ? ["Today"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-1" : "md:grid-cols-5")}>
      {visibleDays.map((day, index) => (
        <div key={day} className="min-h-[420px] rounded-lg border bg-white p-3">
          <p className="text-sm font-semibold">{day}</p>
          <div className="mt-3 flex flex-col gap-2">
            {interviews
              .filter((_, interviewIndex) => compact || interviewIndex % 5 === index)
              .map((interview) => (
                <CalendarCard key={interview.id} interview={interview} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarCard({ interview }: { interview: Interview }) {
  const application = getApplication(interview.applicationId) ?? applications[0];

  return (
    <div className="cursor-grab rounded-md border-l-4 border-l-primary bg-blue-50/70 p-2 shadow-sm">
      <div className="flex items-start gap-1">
        <GripVertical className="mt-0.5 size-3.5 shrink-0 text-blue-500" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900">{application.company}</p>
          <p className="truncate text-[11px] text-slate-600">{interview.stage} - {application.jobTitle}</p>
        </div>
      </div>
    </div>
  );
}

function PerformanceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
