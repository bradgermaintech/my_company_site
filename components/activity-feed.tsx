"use client";

import { useMemo, useState, useTransition } from "react";
import { Activity as ActivityIcon, Search, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Activity, User } from "@/lib/models";
import { formatDate } from "@/lib/utils";

type ActivityFeedProps = {
  activities: Activity[];
  users: User[];
};

export function ActivityFeed({ activities, users }: ActivityFeedProps) {
  const [items, setItems] = useState(activities);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return items;
    }

    return items.filter((activity) => {
      const user = usersById.get(activity.userId);
      return [
        user?.name,
        user?.email,
        activity.action,
        activity.target,
        formatDate(activity.timestamp)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [items, query, usersById]);

  function deleteActivity(activityId: string) {
    setFeedback("");
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/activities/${activityId}`, {
          method: "DELETE"
        });
        const payload = await response.json().catch(() => null) as { error?: string } | null;

        if (!response.ok) {
          setFeedback(payload?.error ?? "Unable to delete the activity record.");
          return;
        }

        setItems((current) => current.filter((activity) => activity.id !== activityId));
      })();
    });
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>
            Review schedule, result, user, and workflow changes across the workspace.
          </CardDescription>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm font-semibold text-muted-foreground">
          <ActivityIcon className="size-4" aria-hidden="true" />
          {items.length} records
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Filter by actor, action, target, or date"
          />
        </div>

        {feedback ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {feedback}
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
            No activity has been recorded yet.
          </div>
        ) : null}

        {items.length > 0 && filteredItems.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
            No activity records match that filter.
          </div>
        ) : null}

        {filteredItems.map((activity) => {
          const user = usersById.get(activity.userId);

          return (
            <div key={activity.id} className="flex gap-3 rounded-lg border bg-background p-4">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                {user?.avatar ?? "AO"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-6">
                  <span className="font-semibold">{user?.name ?? "Unknown user"}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete activity record"
                disabled={isPending}
                onClick={() => deleteActivity(activity.id)}
              >
                <Trash2 className="size-4 text-destructive" aria-hidden="true" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
