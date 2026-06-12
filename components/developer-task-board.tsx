"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, MessageSquareText } from "lucide-react";
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
import { applications, developerTasks, getApplication } from "@/lib/data";
import type { DeveloperTask, TaskStatus } from "@/lib/models";
import { formatDate } from "@/lib/utils";

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

export function DeveloperTaskBoard({ developerId }: { developerId: string }) {
  const [tasks, setTasks] = useState<DeveloperTask[]>(
    developerTasks.filter((task) => task.developerId === developerId)
  );
  const [statusUpdate, setStatusUpdate] = useState(
    "Frontend shell and interview context are on track. Next update after technical prep review."
  );

  const completion = useMemo(() => {
    if (tasks.length === 0) {
      return 0;
    }

    return Math.round(
      (tasks.filter((task) => task.status === "done").length / tasks.length) * 100
    );
  }, [tasks]);

  function moveTask(taskId: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status: nextStatus[task.status] } : task
      )
    );
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
            <div key={column.status} className="rounded-lg border bg-slate-50 p-3">
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
                    const application = getApplication(task.applicationId) ?? applications[0];

                    return (
                      <div key={task.id} className="rounded-lg border bg-white p-3 shadow-line">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{task.title}</p>
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
