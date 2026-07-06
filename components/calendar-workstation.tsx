"use client";

 
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
 
  ExternalLink,
  GripVertical,
  Pencil,
  Trash2,
  Video,
  X
} from "lucide-react";
import { HelpTooltip } from "@/components/help-tooltip";
import { InterviewModal } from "@/components/interview-modal";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
 
import {
  canCreateInterview,
  canDeleteInterview,
  canManageInterviewSchedule,
  canUpdateInterviewResult
} from "@/lib/interview-permissions";
import {
  interviewResultOptions,
  type InterviewInput
} from "@/lib/interview-schema";
import type { Activity, Interview, InterviewStage, JobApplication, User } from "@/lib/models";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week" | "day";

type WeekDay = {
  key: string;
  label: string;
  shortLabel: string;
  date: Date;
};

type CalendarWorkstationProps = {
  applications: JobApplication[];
 
  currentUser: User;
  initialActivities: Activity[];
  initialInterviews: Interview[];
  users: User[];
};

const stages = ["Intro", "Tech", "Culture", "Final"] as const;
 
const slotHours = Array.from({ length: 24 }, (_, index) => index);
const slotHeight = 64;

const stageTone: Record<InterviewStage, string> = {
  Intro:
    "border-l-sky-500 bg-sky-100/95 text-sky-950 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/30",
  Tech:
    "border-l-indigo-500 bg-indigo-100/95 text-indigo-950 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-100 dark:ring-indigo-400/30",
  Culture:
    "border-l-teal-500 bg-teal-100/95 text-teal-950 ring-1 ring-inset ring-teal-200 dark:bg-teal-500/20 dark:text-teal-100 dark:ring-teal-400/30",
  Final:
    "border-l-amber-500 bg-amber-100/95 text-amber-950 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/30"
};

const stageBoardTone: Record<InterviewStage, string> = {
  Intro:
    "border-sky-200 bg-sky-50/80 shadow-sky-100/60 dark:border-sky-400/20 dark:bg-sky-500/10",
  Tech:
    "border-indigo-200 bg-indigo-50/80 shadow-indigo-100/60 dark:border-indigo-400/20 dark:bg-indigo-500/10",
  Culture:
    "border-teal-200 bg-teal-50/80 shadow-teal-100/60 dark:border-teal-400/20 dark:bg-teal-500/10",
  Final:
    "border-amber-200 bg-amber-50/80 shadow-amber-100/60 dark:border-amber-400/20 dark:bg-amber-500/10"
};

const stageAccent: Record<InterviewStage, string> = {
  Intro: "bg-sky-500",
  Tech: "bg-indigo-500",
  Culture: "bg-teal-500",
  Final: "bg-amber-500"
};

function startOfWeek(date: Date) {
  const next = new Date(date);
 
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
 
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDateLabel(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

function formatTimeLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
 
    minute: "2-digit"
  }).format(new Date(date));
}

function formatDateTimeLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(date));
}

function formatCurrentDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getInterviewOffset(interview: Interview) {
  const start = new Date(interview.startTime);
 
  const startHour = start.getHours();
  const startMinutes = start.getMinutes();
  const minutesFromStart = (startHour - slotHours[0]) * 60 + startMinutes;
  return Math.max(0, (minutesFromStart / 60) * slotHeight);
}

function getInterviewHeight(interview: Interview) {
  const start = new Date(interview.startTime).getTime();
  const end = new Date(interview.endTime).getTime();
  const durationMinutes = Math.max(30, (end - start) / (1000 * 60));
  return (durationMinutes / 60) * slotHeight;
}

function getTimeOffset(date: Date) {
  const minutesFromStart = date.getHours() * 60 + date.getMinutes();
  return Math.max(0, (minutesFromStart / 60) * slotHeight);
}

function formatHourLabel(hour: number) {
  if (hour === 0) {
    return "12 AM";
  }

  if (hour === 12) {
    return "12 PM";
  }

  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

type PositionedInterview = {
  interview: Interview;
  offset: number;
  height: number;
  left: number;
  width: number;
};

function buildDayLayout(interviews: Interview[]) {
  const sorted = [...interviews].sort((left, right) => {
    const startDiff =
      new Date(left.startTime).getTime() - new Date(right.startTime).getTime();

    if (startDiff !== 0) {
      return startDiff;
    }

    return new Date(left.endTime).getTime() - new Date(right.endTime).getTime();
  });

  const positioned: PositionedInterview[] = [];
  let group: Interview[] = [];
  let groupEnd = 0;

  const flushGroup = () => {
    if (!group.length) {
      return;
    }

    const columnEndTimes: number[] = [];
    const groupLayouts = group.map((interview) => {
      const start = new Date(interview.startTime).getTime();
      const end = new Date(interview.endTime).getTime();

      let columnIndex = columnEndTimes.findIndex((value) => value <= start);

      if (columnIndex === -1) {
        columnIndex = columnEndTimes.length;
        columnEndTimes.push(end);
      } else {
        columnEndTimes[columnIndex] = end;
      }

      return { interview, columnIndex };
    });

    const columns = Math.max(columnEndTimes.length, 1);
    const width = 100 / columns;

    positioned.push(
      ...groupLayouts.map(({ interview, columnIndex }) => ({
        interview,
        offset: getInterviewOffset(interview),
        height: getInterviewHeight(interview),
        left: columnIndex * width,
        width
      }))
    );

    group = [];
    groupEnd = 0;
  };

  for (const interview of sorted) {
    const start = new Date(interview.startTime).getTime();
    const end = new Date(interview.endTime).getTime();

    if (!group.length || start < groupEnd) {
      group.push(interview);
      groupEnd = Math.max(groupEnd, end);
      continue;
    }

    flushGroup();
    group.push(interview);
    groupEnd = end;
  }

  flushGroup();

  return positioned;
}

function replaceInterview(current: Interview[], next: Interview) {
  const match = current.some((item) => item.id === next.id);

  if (!match) {
    return [next, ...current];
  }

  return current.map((item) => (item.id === next.id ? next : item));
}

export function CalendarWorkstation({
  applications,
 
  currentUser,
  initialActivities,
  initialInterviews,
  users
}: CalendarWorkstationProps) {
  const [view, setView] = useState<CalendarView>("week");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [items, setItems] = useState<Interview[]>(initialInterviews);
 
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [calendarDate, setCalendarDate] = useState(() => startOfDay(new Date()));
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedInterviewId, setSelectedInterviewId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draggingInterviewId, setDraggingInterviewId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<InterviewStage | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [resultNotes, setResultNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const callers = useMemo(
    () => users.filter((user) => user.role === "caller" && user.active),
    [users]
  );
  const developers = useMemo(
    () => users.filter((user) => user.role === "developer" && user.active),
    [users]
  );
  const applicationsById = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications]
  );
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
 
  const interviewActivities = useMemo(
    () =>
      activities
        .filter((activity) => activity.interviewId)
        .sort(
          (left, right) =>
            new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
        ),
    [activities]
  );

  const creatableApplications = useMemo(() => {
    if (currentUser.role === "admin") {
      return applications;
    }

    if (currentUser.role === "caller") {
      return applications.filter((application) => application.callerId === currentUser.id);
    }

    return [];
  }, [applications, currentUser.id, currentUser.role]);

  const canCreate = canCreateInterview(currentUser);
 

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const weekStart = useMemo(() => startOfWeek(calendarDate), [calendarDate]);

  const weekDays = useMemo<WeekDay[]>(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);
        return {
          key: date.toISOString(),
 
          label: formatDateLabel(date, { weekday: "short" }),
          shortLabel: formatDateLabel(date, { weekday: "short" }),
          date
        };
      }),
    [weekStart]
  );

  const [selectedDayKey, setSelectedDayKey] = useState(() => weekDays[0]?.key ?? "");

  useEffect(() => {
    if (!weekDays.find((day) => day.key === selectedDayKey)) {
      setSelectedDayKey(weekDays[0]?.key ?? "");
    }
  }, [selectedDayKey, weekDays]);
 

  useEffect(() => {
    if (!items.some((item) => item.id === selectedInterviewId)) {
      setSelectedInterviewId("");
      setDrawerOpen(false);
    }
  }, [items, selectedInterviewId]);
 

  const monthDays = useMemo(() => {
    const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const firstDayOffset = (monthStart.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();

    return [
      ...Array.from({ length: firstDayOffset }, (_, index) => ({
        key: `blank-${index}`,
        day: null
      })),
      ...Array.from({ length: daysInMonth }, (_, index) => ({
        key: `day-${index + 1}`,
        day: new Date(calendarDate.getFullYear(), calendarDate.getMonth(), index + 1)
      }))
    ];
  }, [calendarDate]);

  const selectedDay =
    view === "day"
      ? {
          key: calendarDate.toISOString(),
          label: formatDateLabel(calendarDate, { weekday: "short" }),
          shortLabel: formatDateLabel(calendarDate, { weekday: "short" }),
          date: calendarDate
        }
      : weekDays.find((day) => day.key === selectedDayKey) ?? weekDays[0];
  const selectedDayInterviews = selectedDay
    ? items
        .filter((interview) => isSameCalendarDay(new Date(interview.startTime), selectedDay.date))
        .sort(
          (left, right) =>
            new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
        )
    : [];

  const upcoming = useMemo(
    () =>
      [...items]
        .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
        .slice(0, 5),
    [items]
  );

  const selectedInterview = useMemo(
    () => items.find((item) => item.id === selectedInterviewId) ?? null,
    [items, selectedInterviewId]
  );
  const selectedApplication = selectedInterview
    ? applicationsById.get(selectedInterview.applicationId) ?? null
    : null;
  const canEditSelected =
    selectedInterview &&
    canManageInterviewSchedule(currentUser, selectedInterview);
  const canDeleteSelected =
    selectedInterview &&
    canDeleteInterview(currentUser, selectedInterview);
  const canUpdateResultSelected =
    selectedInterview &&
    canUpdateInterviewResult(currentUser, selectedInterview);
  const selectedInterviewHistory = useMemo(() => {
    if (!selectedInterview) {
      return [];
    }

    return interviewActivities.filter(
      (activity) => activity.interviewId === selectedInterview.id
    );
  }, [interviewActivities, selectedInterview]);

  useEffect(() => {
    setResultNotes(selectedInterview?.notes ?? "");
  }, [selectedInterview?.id, selectedInterview?.notes]);

  async function saveInterview(values: InterviewInput) {
    const endpoint = editingInterview ? `/api/interviews/${editingInterview.id}` : "/api/interviews";
    const method = editingInterview ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const payload = await response.json();

    if (!response.ok) {
      setFeedback(payload.error ?? "Unable to save the interview.");
      throw new Error(payload.error ?? "Unable to save the interview.");
    }

    const interview = (payload.interview ?? payload) as Interview;
    setItems((current) => replaceInterview(current, interview));
    if (payload.activity) {
      setActivities((current) => [payload.activity as Activity, ...current]);
    }
    setSelectedInterviewId(interview.id);
    setDrawerOpen(true);
    setFeedback(editingInterview ? "Interview updated." : "Interview scheduled.");
    setEditingInterview(null);
  }

  function handleSelectInterview(interviewId: string) {
    setSelectedInterviewId(interviewId);
    setDrawerOpen(true);
    setFeedback("");
  }

  function handleSelectDay(dayKey: string) {
    const day = weekDays.find((item) => item.key === dayKey);
    if (day) {
      setSelectedDayKey(day.key);
      setCalendarDate(startOfDay(day.date));
    }
  }

  function setActiveCalendarDate(date: Date) {
    const next = startOfDay(date);
    setCalendarDate(next);
    setSelectedDayKey(next.toISOString());
  }

  function moveCalendar(direction: -1 | 1) {
    const nextDate = (() => {
      if (view === "month") {
        return addMonths(calendarDate, direction);
      }

      if (view === "day") {
        return addDays(calendarDate, direction);
      }

      return addDays(calendarDate, direction * 7);
    })();

    setActiveCalendarDate(nextDate);
  }

  function resetCalendarToToday() {
    setActiveCalendarDate(new Date());
  }

  function handleCloseDrawer() {
    setDrawerOpen(false);
    setFeedback("");
  }

  function handleOpenCreate() {
    setEditingInterview(null);
    setFeedback("");
    setModalOpen(true);
  }

  function handleOpenEdit() {
    if (!selectedInterview || !canEditSelected) {
      return;
    }

    setEditingInterview(selectedInterview);
    setFeedback("");
    setModalOpen(true);
  }

 
  function handleUpdateResult(result: (typeof interviewResultOptions)[number]) {
    if (!selectedInterview || !canUpdateResultSelected) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/interviews/${selectedInterview.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "result",
            result,
            notes: resultNotes
          })
        });

        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to update the interview result.");
          return;
        }

        const interview = (payload.interview ?? payload) as Interview;
        setItems((current) => replaceInterview(current, interview));
        if (payload.activity) {
          setActivities((current) => [payload.activity as Activity, ...current]);
        }
        setSelectedInterviewId(interview.id);
        setDrawerOpen(true);
        setFeedback(`Interview marked as ${result}.`);
      })();
    });
  }

  function handleMoveInterviewStage(interviewId: string, stage: InterviewStage) {
    const interview = items.find((item) => item.id === interviewId);

    if (
      !interview ||
      interview.stage === stage ||
      !canManageInterviewSchedule(currentUser, interview)
    ) {
      return;
    }

    const nextInput: InterviewInput = {
      applicationId: interview.applicationId,
      callerId: interview.callerId,
      developerId: interview.developerId,
      title: interview.title,
      stage,
      startTime: interview.startTime,
      endTime: interview.endTime,
      meetingLink: interview.meetingLink,
      notes: interview.notes
    };

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/interviews/${interview.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(nextInput)
        });

        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to move the interview stage.");
          return;
        }

        const updatedInterview = (payload.interview ?? payload) as Interview;
        setItems((current) => replaceInterview(current, updatedInterview));
        if (payload.activity) {
          setActivities((current) => [payload.activity as Activity, ...current]);
        }
        setSelectedInterviewId(updatedInterview.id);
        setDrawerOpen(true);
        setFeedback(`Interview moved to ${stage}.`);
      })();
    });
  }

  function handleDeleteInterview() {
    if (!selectedInterview || !canDeleteSelected) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/interviews/${selectedInterview.id}`, {
          method: "DELETE"
        });

        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to delete the interview.");
          return;
        }

        setItems((current) => current.filter((item) => item.id !== selectedInterview.id));
        setActivities((current) =>
          current.filter((activity) => activity.interviewId !== selectedInterview.id)
        );
        setSelectedInterviewId("");
        setDrawerOpen(false);
        setFeedback(
          payload.warning
            ? `Interview deleted. ${payload.warning}`
            : "Interview deleted."
        );
      })();
    });
  }

  const calendarTitle =
    view === "day"
      ? formatDateLabel(calendarDate, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        })
      : formatDateLabel(calendarDate, { month: "long", year: "numeric" });
  const calendarRange =
    view === "month"
      ? `${formatDateLabel(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1), {
          month: "short",
          day: "numeric"
        })} to ${formatDateLabel(
          new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0),
          { month: "short", day: "numeric" }
        )}`
      : view === "day"
        ? formatCurrentDateTime(currentTime)
        : `${formatDateLabel(weekStart, { month: "short", day: "numeric" })} to ${formatDateLabel(addDays(weekStart, 6), { month: "short", day: "numeric" })}`;
  const calendarModeLabel =
    view === "month" ? "Month view" : view === "week" ? "Week planner" : "Day agenda";

  return (
    <>
      <Card>
        <CardHeader className="gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle>Interview calendar workstation</CardTitle>
            <CardDescription>
              Schedule calls, update interview outcomes, and keep role ownership attached to each meeting.
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
            {canCreate ? (
              <Button type="button" onClick={handleOpenCreate} disabled={!creatableApplications.length}>
                <CalendarPlus className="size-4" aria-hidden="true" />
                Add interview
              </Button>
            ) : null}
          </div>
        </CardHeader>

 
        <CardContent className="relative overflow-hidden">
          <InterviewProgressBoard
            applications={applications}
            currentUser={currentUser}
            dragOverStage={dragOverStage}
            draggingInterviewId={draggingInterviewId}
            interviews={items}
            isPending={isPending}
            onDragEnd={() => {
              setDraggingInterviewId(null);
              setDragOverStage(null);
            }}
            onDragOverStage={setDragOverStage}
            onMoveInterview={handleMoveInterviewStage}
            onSelectInterview={handleSelectInterview}
            onStartDrag={setDraggingInterviewId}
            selectedInterviewId={selectedInterviewId}
            users={usersById}
          />

          <div className="min-w-0 rounded-xl border bg-card p-3 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex overflow-hidden rounded-lg border bg-background shadow-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Previous ${view}`}
                      className="rounded-none border-r"
                      onClick={() => moveCalendar(-1)}
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Next ${view}`}
                      className="rounded-none"
                      onClick={() => moveCalendar(1)}
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={resetCalendarToToday}>
                    Today
                  </Button>
                  <div className="min-w-[220px] rounded-lg border bg-background px-3 py-2 shadow-sm">
                    <p className="text-base font-semibold leading-tight text-foreground">
                      {calendarTitle}
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {calendarRange}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {calendarModeLabel}
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
 
              <MonthGrid
                applications={applications}
                days={monthDays}
                interviews={items}
                onSelectInterview={handleSelectInterview}
                selectedInterviewId={selectedInterviewId}
              />
            ) : (
              <WeekGrid
                applications={applications}
                currentTime={currentTime}
                interviews={items}
                compact={view === "day"}
                onSelectDay={handleSelectDay}
 
                onSelectInterview={handleSelectInterview}
                selectedDayKey={selectedDay?.key}
                selectedInterviewId={selectedInterviewId}
                weekDays={weekDays}
              />
            )}
          </div>

          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-40 transition-opacity duration-300",
              drawerOpen ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!drawerOpen}
          >
            <button
              type="button"
              aria-label="Close interview details"
              className={cn(
                "absolute inset-0 bg-slate-950/30 transition-opacity duration-300 xl:bg-slate-950/16",
                drawerOpen ? "opacity-100" : "opacity-0"
              )}
              onClick={handleCloseDrawer}
            />

            <aside
              className={cn(
                "pointer-events-auto absolute inset-y-0 right-0 z-10 flex h-full w-full max-w-[92vw] flex-col border-l bg-background/98 shadow-2xl backdrop-blur transition-transform duration-300 ease-out sm:max-w-[30rem] lg:max-w-[34rem] xl:max-w-[38rem]",
                drawerOpen ? "translate-x-0" : "translate-x-full"
              )}
            >
              <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Interview details
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">Schedule focus</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review upcoming interviews and inspect the selected meeting without leaving the calendar.
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={handleCloseDrawer}>
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="min-w-0 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Upcoming interviews</h3>
                  <p className="text-xs text-muted-foreground">
                    Click any interview to inspect details, edit the schedule, or record the outcome.
                  </p>
                </div>
                <Video className="size-4 text-primary" aria-hidden="true" />
              </div>

 
              <div className="mt-4 flex flex-col gap-3">
                {(view === "day" ? selectedDayInterviews : upcoming).map((interview) => {
                  const application = applicationsById.get(interview.applicationId) ?? applications[0];
                  const developer = usersById.get(interview.developerId);

                  return (
 
                    <button
                      key={interview.id}
                      type="button"
                      onClick={() => handleSelectInterview(interview.id)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all duration-200",
                        interview.id === selectedInterviewId
                          ? "translate-x-1 border-primary bg-primary/8 shadow-sm"
                          : "bg-slate-50/80 hover:border-primary/30 hover:bg-muted/40 dark:bg-card/70"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{interview.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {application.company} - {developer?.name}
                          </p>
                        </div>
                        <StatusBadge status={interview.result} />
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {formatDateTimeLabel(interview.startTime)}
                      </p>
                    </button>
                  );
                })}

                {view === "day" && selectedDayInterviews.length === 0 ? (
 
                  <div className="rounded-xl border border-dashed bg-slate-50/70 p-4 text-sm text-muted-foreground dark:bg-card/70">
                    No interviews booked for {selectedDay?.shortLabel}.
                  </div>
                ) : null}
              </div>
                </div>

                <div
                  className={cn(
                    "mt-4 min-w-0 rounded-xl border bg-card p-4 shadow-sm transition-all duration-300",
                    selectedInterview ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.985] opacity-90"
                  )}
                >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Interview detail</h3>
                  <p className="text-xs text-muted-foreground">
                    The selected meeting opens here, similar to a calendar side panel.
                  </p>
                </div>
                <HelpTooltip content="Admins can manage all interviews. Callers manage schedules for their interviews. Developers can update interview results for their assigned interviews. Bidders can review only." />
              </div>

              {feedback ? (
                <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  {feedback}
                </div>
              ) : null}

              {selectedInterview && selectedApplication ? (
                <div className="mt-4 grid gap-4">
                  <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold">{selectedInterview.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedApplication.company} - {selectedApplication.jobTitle}
                        </p>
                      </div>
                      <p className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                        {formatTimeLabel(selectedInterview.startTime)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={selectedInterview.stage} />
                      <StatusBadge status={selectedInterview.result} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailBox label="Start" value={formatDateTimeLabel(selectedInterview.startTime)} />
                    <DetailBox label="End" value={formatDateTimeLabel(selectedInterview.endTime)} />
                    <DetailBox label="Caller" value={usersById.get(selectedInterview.callerId)?.name ?? "Unknown"} />
                    <DetailBox label="Developer" value={usersById.get(selectedInterview.developerId)?.name ?? "Unknown"} />
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          Calendar integration
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {selectedInterview.googleSyncStatus === "synced"
                            ? `Synced to Google Calendar${selectedInterview.googleSyncedAt ? ` on ${formatDateTimeLabel(selectedInterview.googleSyncedAt)}` : ""}. Attendees receive Google updates when the schedule changes.`
                            : selectedInterview.googleSyncStatus === "not_connected"
                              ? "Caller has not connected Google Calendar yet. Sign in with Google on that caller account to enable sync and attendee email notifications."
                              : selectedInterview.googleSyncStatus === "disabled"
                                ? "Google Calendar sync is disabled until Google credentials are added in the environment."
                                : selectedInterview.googleSyncStatus === "error"
                                  ? selectedInterview.googleSyncError ?? "Google Calendar sync hit an error."
                                  : "Google Calendar sync is waiting for the latest schedule update."}
                        </p>
                      </div>
                      {selectedInterview.googleEventUrl ? (
                        <a
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                          href={selectedInterview.googleEventUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="size-4" aria-hidden="true" />
                          Open in Google Calendar
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <a
                    className="inline-flex h-10 min-w-0 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    href={selectedInterview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join meeting
                  </a>

                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {selectedInterview.notes}
                    </p>
                  </div>

                  {canUpdateResultSelected ? (
                    <div className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">Interview result workflow</p>
                        <HelpTooltip content="Use this after the meeting to record the outcome and leave a note for the next teammate." />
                      </div>
                      <Input
                        value={resultNotes}
                        onChange={(event) => setResultNotes(event.target.value)}
                        placeholder="Add a result note before updating the status"
                        className="min-w-0"
                      />
                      <div className="flex flex-wrap gap-2">
                        {interviewResultOptions.map((result) => (
                          <Button
                            key={result}
                            type="button"
                            variant={selectedInterview.result === result ? "default" : "outline"}
                            onClick={() => handleUpdateResult(result)}
                            disabled={isPending}
                          >
                            {result === "reschedule" ? "Reschedule" : result[0].toUpperCase() + result.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {canEditSelected ? (
                      <Button type="button" variant="outline" onClick={handleOpenEdit}>
                        <Pencil className="size-4" />
                        Edit interview
                      </Button>
                    ) : null}
                    {canDeleteSelected ? (
                      <Button type="button" variant="destructive" onClick={handleDeleteInterview} disabled={isPending}>
                        <Trash2 className="size-4" />
                        Delete interview
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">Interview history</p>
                      <HelpTooltip content="This shows who changed the interview schedule or result, plus when the change happened." />
                    </div>
                    {selectedInterviewHistory.length ? (
                      <div className="grid gap-3">
                        {selectedInterviewHistory.map((activity) => {
                          const actor = usersById.get(activity.userId);

                          return (
                            <div
                              key={activity.id}
                              className="rounded-lg border bg-background px-3 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {activity.action}
                                  </p>
                                  <p className="mt-1 break-words text-sm text-muted-foreground">
                                    {activity.target}
                                  </p>
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    {actor?.name ?? "Unknown user"} | {formatDateTimeLabel(activity.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed bg-background px-3 py-4 text-sm text-muted-foreground">
                        No interview history yet. The audit trail will appear here after schedule or result changes.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed bg-muted/10 p-6 text-sm text-muted-foreground">
                  Select a meeting from the calendar or from the upcoming list to open its detail panel here.
                </div>
              )}
                </div>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <InterviewModal
 
        applications={creatableApplications}
        callers={callers}
        currentUser={currentUser}
        developers={developers}
        interview={editingInterview}
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingInterview(null);
          }
          setModalOpen(open);
        }}
        onSave={saveInterview}
      />
    </>
  );
}

function InterviewProgressBoard({
  applications,
  currentUser,
  dragOverStage,
  draggingInterviewId,
  interviews,
  isPending,
  onDragEnd,
  onDragOverStage,
  onMoveInterview,
  onSelectInterview,
  onStartDrag,
  selectedInterviewId,
  users
}: {
  applications: JobApplication[];
  currentUser: User;
  dragOverStage: InterviewStage | null;
  draggingInterviewId: string | null;
  interviews: Interview[];
  isPending: boolean;
  onDragEnd: () => void;
  onDragOverStage: (stage: InterviewStage | null) => void;
  onMoveInterview: (interviewId: string, stage: InterviewStage) => void;
  onSelectInterview: (id: string) => void;
  onStartDrag: (id: string) => void;
  selectedInterviewId: string;
  users: Map<string, User>;
}) {
  const applicationsById = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications]
  );
  const orderedInterviews = useMemo(
    () =>
      [...interviews].sort(
        (left, right) =>
          new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
      ),
    [interviews]
  );
  const completedCount = interviews.filter((interview) =>
    ["passed", "failed"].includes(interview.result)
  ).length;

  return (
    <section className="mb-5 rounded-xl border bg-muted/15 p-3 shadow-sm sm:p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Interview progress confirmation</h3>
            <HelpTooltip content="Drag interview cards between stages to confirm where each meeting sits in the hiring flow. The badge on each card shows the current result." />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Move calls through Intro, Tech, Culture, and Final while keeping the schedule visible below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{interviews.length} total</Badge>
          <Badge variant={completedCount ? "success" : "outline"}>
            {completedCount} completed
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {stages.map((stage) => {
          const stageInterviews = orderedInterviews.filter(
            (interview) => interview.stage === stage
          );
          const isDropTarget = dragOverStage === stage;

          return (
            <div
              key={stage}
              className={cn(
                "min-h-[260px] rounded-xl border p-3 shadow-sm transition-all",
                stageBoardTone[stage],
                isDropTarget && "scale-[1.01] border-primary shadow-lg ring-2 ring-primary/30"
              )}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggingInterviewId) {
                  onDragOverStage(stage);
                }
              }}
              onDragLeave={() => {
                onDragOverStage((dragOverStage === stage ? null : dragOverStage));
              }}
              onDrop={(event) => {
                event.preventDefault();
                const interviewId =
                  event.dataTransfer.getData("text/plain") || draggingInterviewId;

                if (interviewId) {
                  onMoveInterview(interviewId, stage);
                }

                onDragEnd();
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", stageAccent[stage])} />
                  <h4 className="text-sm font-semibold">{stage}</h4>
                </div>
                <span className="rounded-md bg-background/80 px-2 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
                  {stageInterviews.length}
                </span>
              </div>

              <div className="flex min-h-[210px] flex-col gap-3">
                {stageInterviews.map((interview) => {
                  const application =
                    applicationsById.get(interview.applicationId) ?? applications[0];
                  const caller = users.get(interview.callerId);
                  const developer = users.get(interview.developerId);
                  const canDrag = canManageInterviewSchedule(currentUser, interview);
                  const selected = selectedInterviewId === interview.id;

                  return (
                    <button
                      key={interview.id}
                      type="button"
                      draggable={canDrag && !isPending}
                      onClick={() => onSelectInterview(interview.id)}
                      onDragStart={(event) => {
                        if (!canDrag || isPending) {
                          event.preventDefault();
                          return;
                        }

                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", interview.id);
                        onStartDrag(interview.id);
                      }}
                      onDragEnd={onDragEnd}
                      className={cn(
                        "group relative rounded-xl border bg-background p-3 text-left shadow-sm transition-all duration-200",
                        canDrag && !isPending && "cursor-grab active:cursor-grabbing",
                        !canDrag && "cursor-pointer",
                        draggingInterviewId === interview.id &&
                          "scale-[1.02] border-primary opacity-70 shadow-lg",
                        selected
                          ? "border-primary bg-primary/8 shadow-[0_0_0_1px_rgba(99,102,241,0.22),0_16px_34px_rgba(59,130,246,0.18)] ring-2 ring-primary/25"
                          : "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2">
                          <GripVertical
                            className={cn(
                              "mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors",
                              canDrag && "group-hover:text-primary"
                            )}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {interview.title}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {application.company} - {application.jobTitle}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={interview.result} />
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <Clock className="size-3.5" aria-hidden="true" />
                          {formatDateTimeLabel(interview.startTime)}
                        </p>
                        <p className="truncate">
                          {caller?.name ?? "Caller pending"} /{" "}
                          {developer?.name ?? "Developer pending"}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {application.status === "Bid" ? "Submitted" : application.status}
                        </Badge>
                        {selected ? <Badge variant="info">Selected</Badge> : null}
                      </div>
                    </button>
                  );
                })}

                {stageInterviews.length === 0 ? (
                  <div className="flex min-h-[136px] items-center justify-center rounded-lg border border-dashed bg-background/50 px-4 text-center text-sm text-muted-foreground">
                    Drop an interview here to confirm the {stage.toLowerCase()} step.
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MonthGrid({
  applications,
  days,
 
  interviews,
  onSelectInterview,
  selectedInterviewId
  }: {
    applications: JobApplication[];
    days: Array<{ key: string; day: Date | null }>;
    interviews: Interview[];
    onSelectInterview: (id: string) => void;
    selectedInterviewId: string;
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
          ? interviews.filter((interview) =>
              isSameCalendarDay(new Date(interview.startTime), day)
            )
          : [];

        return (
          <div
            key={key}
            className={cn(
              "min-h-[104px] rounded-lg border bg-white p-2 dark:bg-card/80",
              day === null && "border-transparent bg-transparent"
            )}
          >
            {day ? <p className="text-xs font-semibold">{day.getDate()}</p> : null}
            <div className="mt-2 flex flex-col gap-1">
              {dayInterviews.slice(0, 2).map((interview) => (
                <CalendarCard
                  key={interview.id}
                  applications={applications}
                  interview={interview}
 
                  onSelect={() => onSelectInterview(interview.id)}
                  selected={selectedInterviewId === interview.id}
 
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekGrid({
  applications,
  currentTime,
  interviews,
  compact,
  weekDays,
  selectedDayKey,
 
  selectedInterviewId,
  onSelectDay,
  onSelectInterview
}: {
  applications: JobApplication[];
  currentTime: Date;
  interviews: Interview[];
  weekDays: WeekDay[];
  compact?: boolean;
  selectedDayKey?: string;
 
  selectedInterviewId: string;
  onSelectDay: (key: string) => void;
  onSelectInterview: (id: string) => void;
}) {
  const visibleDays = compact ? weekDays.filter((day) => day.key === selectedDayKey) : weekDays;
  const gridHeight = slotHours.length * slotHeight;

  return (
 
    <div className="relative z-0 overflow-hidden rounded-xl border bg-white/90 shadow-sm dark:bg-card/90">
      {compact ? (
        <div className="border-b bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {visibleDays[0]?.label}
          </p>
          <p className="text-lg font-semibold">
            {visibleDays[0]
 
              ? formatDateLabel(visibleDays[0].date, { month: "long", day: "numeric" })
              : ""}
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <div
          className={cn(
 
            "grid min-w-[1280px]",
            compact
              ? "grid-cols-[96px_minmax(360px,1fr)]"
              : "grid-cols-[96px_repeat(7,minmax(160px,1fr))]"
          )}
        >
          <div className="sticky left-0 z-[1] border-r bg-slate-50 shadow-[8px_0_18px_rgba(15,23,42,0.06)] dark:bg-slate-900/70">
            <div className="flex h-20 items-end justify-end border-b px-4 pb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Time
            </div>
            {slotHours.map((hour) => (
              <div
                key={hour}
                className="border-b px-4 pt-2 text-right text-xs font-bold leading-none text-slate-700 dark:text-slate-200"
                style={{ height: `${slotHeight}px` }}
              >
 
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {visibleDays.map((day) => {
            const dayInterviews = interviews.filter((interview) =>
 
              isSameCalendarDay(new Date(interview.startTime), day.date)
            );
            const layouts = buildDayLayout(dayInterviews);
            const showCurrentTime = isSameCalendarDay(day.date, currentTime);

            return (
              <div key={day.key} className="relative border-r last:border-r-0">
                <button
                  type="button"
                  onClick={() => onSelectDay(day.key)}
                  className={cn(
                    "sticky top-0 z-[2] flex h-20 w-full items-center border-b bg-white/95 px-4 text-left backdrop-blur transition-colors dark:bg-card/95",
                    day.key === selectedDayKey && "bg-primary/10"
                  )}
                >
                  <div>
                    <p className="text-base font-semibold text-foreground">{day.shortLabel}</p>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {formatDateLabel(day.date, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </button>

                <div className="relative bg-white dark:bg-card" style={{ height: `${gridHeight}px` }}>
                  {slotHours.map((hour) => (
                    <div
                      key={`${day.key}-${hour}`}
                      className="border-b border-dashed border-slate-200/90 dark:border-slate-700/70"
                      style={{ height: `${slotHeight}px` }}
                    />
                  ))}

                  {showCurrentTime ? (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-red-500"
                      style={{ top: `${getTimeOffset(currentTime)}px` }}
                    >
                      <span className="absolute left-2 top-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-sm">
                        Now
                      </span>
                    </div>
                  ) : null}

 
                  {layouts.map(({ interview, offset, height, left, width }) => (
                    <TimedCalendarCard
                      key={interview.id}
                      applications={applications}
                      interview={interview}
 
                      offset={offset}
                      height={height}
                      left={left}
                      width={width}
                      onSelect={() => onSelectInterview(interview.id)}
                      selected={selectedInterviewId === interview.id}
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

function CalendarCard({
  applications,
 
  interview,
  onSelect,
  selected
}: {
  applications: JobApplication[];
  interview: Interview;
  onSelect: () => void;
  selected: boolean;
}) {
  const application = applications.find((item) => item.id === interview.applicationId) ?? applications[0];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-md p-0 text-left shadow-sm transition-all duration-200",
        selected ? "scale-[1.01] ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      )}
    >
      <div
        className={cn(
          "cursor-pointer rounded-md border-l-4 border-l-primary bg-blue-50/70 p-2 dark:bg-primary/10",
          selected &&
            "bg-primary/10 shadow-[0_0_0_1px_rgba(99,102,241,0.22),0_10px_30px_rgba(59,130,246,0.18)] dark:bg-primary/18"
        )}
      >
        <div className="flex items-start gap-1">
          <GripVertical className="mt-0.5 size-3.5 shrink-0 text-blue-500" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900 dark:text-foreground">
              {application.company}
            </p>
            <p className="truncate text-[11px] text-slate-600 dark:text-muted-foreground">
              {interview.stage} - {application.jobTitle}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

function TimedCalendarCard({
  applications,
  interview,
  offset,
  height,
  left,
  width,
  onSelect,
  selected
}: {
  applications: JobApplication[];
  interview: Interview;
  offset: number;
  height: number;
  left: number;
  width: number;
  onSelect: () => void;
  selected: boolean;
}) {
  const application = applications.find((item) => item.id === interview.applicationId) ?? applications[0];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "absolute overflow-hidden rounded-xl border p-0 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:z-20 hover:scale-[1.01]",
        stageTone[interview.stage],
        selected
          ? "z-30 scale-[1.015] ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_18px_42px_rgba(15,23,42,0.22)]"
          : "hover:shadow-lg"
      )}
      style={{
        top: `${offset}px`,
        height: `${Math.max(height, 56)}px`,
        left: `calc(${left}% + 6px)`,
        width: `calc(${width}% - 12px)`
      }}
    >
      <div
        className={cn(
          "flex h-full items-start gap-2 p-2",
          selected && "bg-white/30 dark:bg-white/5"
        )}
      >
        <GripVertical
          className={cn(
            "mt-0.5 size-3.5 shrink-0 opacity-70",
            selected && "text-primary opacity-100"
          )}
          aria-hidden="true"
        />
        <div className="min-w-0">
 
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-xs font-semibold">{application.company}</p>
            {selected ? (
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary shadow-sm dark:bg-slate-950/70">
                Selected
              </span>
            ) : null}
          </div>
          <p className="truncate text-[11px] opacity-80">
            {interview.stage} | {application.jobTitle}
          </p>
          <p className="mt-1 text-[11px] font-medium opacity-80">
            {formatTimeLabel(interview.startTime)} to {formatTimeLabel(interview.endTime)}
          </p>
        </div>
      </div>
    </button>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
 
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
