import { Activity as ActivityIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { Activity, User } from "@/lib/models";
import { formatDate } from "@/lib/utils";

type ActivityFeedProps = {
  activities: Activity[];
  users: User[];
};

export function ActivityFeed({ activities, users }: ActivityFeedProps) {
  const usersById = new Map(users.map((user) => [user.id, user]));

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
          {activities.length} records
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {activities.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
            No activity has been recorded yet.
          </div>
        ) : null}
        {activities.map((activity) => {
          const user = usersById.get(activity.userId);

          return (
            <div key={activity.id} className="flex gap-3 rounded-lg border bg-background p-4">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                {user?.avatar ?? "AO"}
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-6">
                  <span className="font-semibold">{user?.name ?? "Unknown user"}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
