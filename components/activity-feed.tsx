import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activities, getUser } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {activities.map((activity) => {
          const user = getUser(activity.userId);

          return (
            <div key={activity.id} className="flex gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                {user?.avatar}
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-6">
                  <span className="font-semibold">{user?.name}</span>{" "}
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
