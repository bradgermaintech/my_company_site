"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, GripVertical, Video } from "lucide-react";
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
import type { Interview, InterviewStage } from "@/lib/models";
import { cn, formatDate } from "@/lib/utils";

type CalendarView = "month" | "week" | "day";
type WeekDay = {
  key: string;
  label: string;
  shortLabel: string;
  date: Date;
};

const stages = ["Intro", "Tech", "Culture", "Final"] as const;
const stageTone: Record<InterviewStage, string> = {
  Intro:
    "border-l-sky-500 bg-sky-50 text-sky-950 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/18 dark:text-sky-100 dark:ring-sky-400/30",
  Tech:
    "border-l-indigo-500 bg-indigo-50 text-indigo-950 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/18 dark:text-indigo-100 dark:ring-indigo-400/30",
  Culture:
    "border-l-teal-500 bg-teal-50 text-teal-950 ring-1 ring-inset ring-teal-200 dark:bg-teal-500/18 dark:text-teal-100 dark:ring-teal-400/30",
  Final:
    "border-l-amber-500 bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/18 dark:text-amber-100 dark:ring-amber-400/30"
};
const slotHours = Array.from({ length: 12 }, (_, index) => index + 8);
const slotHeight = 72;
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setUTCDate(next.getUTCDate() + diff);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isSameUtcDay(left: Date, right: Date) {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

function formatWeekdayDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(date);
}

function formatTimeLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(new Date(date));
}

export function CalendarWorkstation() {
  const [view, setView] = useState<CalendarView>("week");
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<Interview[]>(initialInterviews);

  const weekStart = useMemo(() => {
    const reference = items[0] ? new Date(items[0].startTime) : new Date("2026-06-08T00:00:00Z");
    return startOfWeek(reference);
  }, [items]);

  const weekDays = useMemo<WeekDay[]>(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);
        return {
          key: date.toISOString(),
          label: dayNames[date.getUTCDay()],
          shortLabel: formatWeekdayDate(date, { weekday: "short" }),
          date
        };
      }),
    [weekStart]
  );

  const [selectedDayKey, setSelectedDayKey] = useState(() => weekDays[0]?.key ?? "");

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

  const selectedDay = weekDays.find((day) => day.key === selectedDayKey) ?? weekDays[0];

  const selectedDayInterviews = selectedDay
    ? items.filter((interview) => isSameUtcDay(new Date(interview.startTime), selectedDay.date))
    : [];

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
          <div className="rounded-xl border bg-card p-3 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" aria-label="Previous week">
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" aria-label="Next week">
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                  <div>
                    <p className="text-sm font-semibold">
                      {formatWeekdayDate(weekStart, { month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatWeekdayDate(weekStart, { month: "short", day: "numeric" })} to{" "}
                      {formatWeekdayDate(addDays(weekStart, 6), { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {view === "month" ? "Month grid" : view === "week" ? "Week planner" : "Day agenda"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage) => (
                  <span
                    key={stage}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-semibold",
                      stageTone[stage]
                    )}
                  >
                    {stage}
                  </span>
                ))}
              </div>
            </div>

            {view === "month" ? (
              <MonthGrid days={monthDays} interviews={items} />
            ) : (
              <WeekGrid
                interviews={items}
                compact={view === "day"}
                weekDays={weekDays}
                selectedDayKey={selectedDay?.key}
                onSelectDay={setSelectedDayKey}
              />
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <PerformanceMetric label="Interviews booked" value={items.length.toString()} />
              <PerformanceMetric label="Show rate" value="92%" />
              <PerformanceMetric label="Pass rate" value="64%" />
              <PerformanceMetric label="Follow-ups" value="7" />
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Upcoming interviews</h3>
                  <p className="text-xs text-muted-foreground">Meet links and stage context ready to launch.</p>
                </div>
                <Video className="size-4 text-primary" aria-hidden="true" />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {(view === "day" ? selectedDayInterviews : upcoming).map((interview) => {
                  const application = getApplication(interview.applicationId) ?? applications[0];
                  const developer = getUser(interview.developerId);

                  return (
                    <div key={interview.id} className="rounded-xl border bg-slate-50/80 p-3">
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
                {view === "day" && selectedDayInterviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-slate-50/70 p-4 text-sm text-muted-foreground">
                    No interviews booked for {selectedDay?.shortLabel}.
                  </div>
                ) : null}
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
  compact,
  weekDays,
  selectedDayKey,
  onSelectDay
}: {
  interviews: Interview[];
  weekDays: WeekDay[];
  compact?: boolean;
  selectedDayKey?: string;
  onSelectDay: (key: string) => void;
}) {
  const visibleDays = compact ? weekDays.filter((day) => day.key === selectedDayKey) : weekDays;
  const gridHeight = slotHours.length * slotHeight;

  return (
    <div className="overflow-hidden rounded-xl border bg-white/70 dark:bg-card/80">
      {!compact ? (
        <div className="grid grid-cols-7 border-b bg-slate-50/90 dark:bg-slate-900/40">
          {weekDays.map((day) => {
            const active = day.key === selectedDayKey;

            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onSelectDay(day.key)}
                className={cn(
                  "flex min-h-[68px] flex-col items-start gap-1 border-r px-4 py-3 text-left transition-colors last:border-r-0",
                  active && "bg-primary/10"
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {day.label}
                </span>
                <span className="text-lg font-semibold">
                  {formatWeekdayDate(day.date, { day: "numeric" })}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="border-b bg-slate-50/90 px-4 py-3 dark:bg-slate-900/40">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {visibleDays[0]?.label}
          </p>
          <p className="text-lg font-semibold">
            {visibleDays[0] ? formatWeekdayDate(visibleDays[0].date, { month: "long", day: "numeric" }) : ""}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <div
          className={cn(
            "grid min-w-[900px]",
            compact ? "grid-cols-[72px_minmax(280px,1fr)]" : "grid-cols-[72px_repeat(7,minmax(140px,1fr))]"
          )}
        >
          <div className="border-r bg-slate-50/70 dark:bg-slate-900/30">
            <div className="h-14 border-b" />
            {slotHours.map((hour) => (
              <div
                key={hour}
                className="border-b px-3 pt-1.5 text-right text-[11px] font-medium text-muted-foreground"
                style={{ height: `${slotHeight}px` }}
              >
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
            ))}
          </div>

          {visibleDays.map((day) => {
            const dayInterviews = interviews.filter((interview) =>
              isSameUtcDay(new Date(interview.startTime), day.date)
            );

            return (
              <div key={day.key} className="relative border-r last:border-r-0">
                <div className="flex h-14 items-center border-b px-3">
                  <div>
                    <p className="text-sm font-semibold">{day.shortLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatWeekdayDate(day.date, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>

                <div className="relative" style={{ height: `${gridHeight}px` }}>
                  {slotHours.map((hour) => (
                    <div
                      key={`${day.key}-${hour}`}
                      className="border-b border-dashed border-slate-200/90 dark:border-slate-700/70"
                      style={{ height: `${slotHeight}px` }}
                    />
                  ))}

                  {dayInterviews.map((interview) => (
                    <TimedCalendarCard
                      key={interview.id}
                      interview={interview}
                      offset={getInterviewOffset(interview)}
                      height={getInterviewHeight(interview)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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

function TimedCalendarCard({
  interview,
  offset,
  height
}: {
  interview: Interview;
  offset: number;
  height: number;
}) {
  const application = getApplication(interview.applicationId) ?? applications[0];

  return (
    <div
      className={cn(
        "absolute left-2 right-2 cursor-grab overflow-hidden rounded-xl border border-l-4 p-2 shadow-sm backdrop-blur-sm",
        stageTone[interview.stage]
      )}
      style={{ top: `${offset}px`, height: `${Math.max(height, 56)}px` }}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-3.5 shrink-0 opacity-70" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{application.company}</p>
          <p className="truncate text-[11px] opacity-80">
            {interview.stage} · {application.jobTitle}
          </p>
          <p className="mt-1 text-[11px] font-medium opacity-80">
            {formatTimeLabel(interview.startTime)} to {formatTimeLabel(interview.endTime)}
          </p>
        </div>
      </div>
    </div>
  );
}

function PerformanceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function getInterviewOffset(interview: Interview) {
  const start = new Date(interview.startTime);
  const startHour = start.getUTCHours();
  const startMinutes = start.getUTCMinutes();
  const minutesFromStart = (startHour - slotHours[0]) * 60 + startMinutes;
  return Math.max(0, (minutesFromStart / 60) * slotHeight);
}

function getInterviewHeight(interview: Interview) {
  const start = new Date(interview.startTime).getTime();
  const end = new Date(interview.endTime).getTime();
  const durationMinutes = Math.max(30, (end - start) / (1000 * 60));
  return (durationMinutes / 60) * slotHeight;
}
