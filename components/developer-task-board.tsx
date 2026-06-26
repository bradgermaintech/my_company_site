"use client";

import { useMemo, useState, useTransition } from "react";
<<<<<<< HEAD
import { ArrowRight, CalendarCheck, GripVertical, MessageSquareText } from "lucide-react";
=======
import { ArrowRight, CalendarCheck, MessageSquareText } from "lucide-react";
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { DeveloperTask, JobApplication, TaskStatus } from "@/lib/models";
<<<<<<< HEAD
import { cn, formatDate } from "@/lib/utils";
=======
import { formatDate } from "@/lib/utils";
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e

const columns: Array<{ status: TaskStatus; label: string }> = [
  { status: "todo", label: "Todo" },
  { status: "in-progress", label: "In Progress" },
  { status: "review", label: "Review" },
  { status: "done", label: "Done" }
];

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: "in-progress",
  "in-progress": "review",
  review: "done",
  done: "done"
};

type DeveloperTaskBoardProps = {
  applications: JobApplication[];
  developerId: string;
  initialTasks: DeveloperTask[];
};

export function DeveloperTaskBoard({
  applications,
  developerId,
  initialTasks
}: DeveloperTaskBoardProps) {
  const [tasks, setTasks] = useState<DeveloperTask[]>(initialTasks);
  const [statusUpdate, setStatusUpdate] = useState(
    "Frontend shell and interview context are on track. Next update after technical prep review."
  );
<<<<<<< HEAD
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
=======
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
  const [isPending, startTransition] = useTransition();
  const applicationsById = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications]
  );

  const completion = useMemo(() => {
    if (tasks.length === 0) {
      return 0;
    }

    return Math.round(
      (tasks.filter((task) => task.status === "done").length / tasks.length) * 100
    );
  }, [tasks]);

  function updateTaskStatus(taskId: string, status: TaskStatus) {
    const currentTask = tasks.find((task) => task.id === taskId);

    if (!currentTask || currentTask.status === status) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/developer-tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        return;
      }

      const updatedTask = (await response.json()) as DeveloperTask;
      setTasks((current) =>
        current.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
    });
  }

  function moveTask(taskId: string) {
    const currentTask = tasks.find((task) => task.id === taskId);
<<<<<<< HEAD

=======
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
    if (!currentTask) {
      return;
    }

<<<<<<< HEAD
    updateTaskStatus(taskId, nextStatus[currentTask.status]);
=======
    const next = nextStatus[currentTask.status];

    startTransition(async () => {
      const response = await fetch(`/api/developer-tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: next })
      });

      if (!response.ok) {
        return;
      }

      const updatedTask = (await response.json()) as DeveloperTask;
      setTasks((current) =>
        current.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
    });
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
  }

  return (
    <Card>
      <CardHeader className="gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <CardTitle>Developer workflow board</CardTitle>
          <CardDescription>
            Track assigned delivery work, linked job context, technical notes, and admin-visible progress.
          </CardDescription>
        </div>
        <div className="min-w-[240px] rounded-lg border bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Admin-visible progress</p>
            <span className="text-sm font-bold">{completion}%</span>
          </div>
          <Progress value={completion} className="mt-3" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 lg:grid-cols-3">
          {applications
            .filter((application) => application.developerId === developerId)
            .slice(0, 3)
            .map((application) => (
              <div key={application.id} className="rounded-lg border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{application.company}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {application.jobTitle}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Linked context: {application.notes}
                </p>
              </div>
            ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-4">
          {columns.map((column) => (
            <div
              key={column.status}
              className={cn(
                "rounded-lg border bg-slate-50 p-3 transition-colors",
                dragOverStatus === column.status && "border-primary bg-primary/5"
              )}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggingTaskId) {
                  setDragOverStatus(column.status);
                }
              }}
              onDragLeave={() => {
                setDragOverStatus((current) => (current === column.status ? null : current));
              }}
              onDrop={(event) => {
                event.preventDefault();
                const taskId = event.dataTransfer.getData("text/plain") || draggingTaskId;

                if (taskId) {
                  updateTaskStatus(taskId, column.status);
                }

                setDraggingTaskId(null);
                setDragOverStatus(null);
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{column.label}</h3>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {tasks.filter((task) => task.status === column.status).length}
                </span>
              </div>
              <div className="flex min-h-[280px] flex-col gap-3">
                {tasks
                  .filter((task) => task.status === column.status)
                  .map((task) => {
                    const application = applicationsById.get(task.applicationId) ?? applications[0];

                    return (
                      <div
                        key={task.id}
                        draggable={!isPending}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", task.id);
                          setDraggingTaskId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggingTaskId(null);
                          setDragOverStatus(null);
                        }}
                        className={cn(
                          "rounded-lg border bg-white p-3 shadow-line transition-all",
                          isPending && "cursor-progress",
                          draggingTaskId === task.id && "scale-[1.02] border-primary shadow-lg opacity-70",
                          !isPending && "cursor-grab active:cursor-grabbing"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-2">
                            <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <p className="text-sm font-semibold">{task.title}</p>
                          </div>
                          <StatusBadge status={task.priority} />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {task.description}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarCheck className="size-3.5" aria-hidden="true" />
                          {formatDate(task.dueDate)}
                        </div>
                        <p className="mt-2 text-xs font-medium text-slate-700">
                          {application.company}
                        </p>
                        {task.status !== "done" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            disabled={isPending}
                            onClick={() => moveTask(task.id)}
                          >
                            Move forward
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold">Status update</h3>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Drag tasks between columns to update delivery status for the team workspace.
          </p>
          <Textarea
            value={statusUpdate}
            onChange={(event) => setStatusUpdate(event.target.value)}
            className="mt-3 min-h-[96px] bg-white"
          />
          <div className="mt-3 flex justify-end">
            <Button type="button">Publish update</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
