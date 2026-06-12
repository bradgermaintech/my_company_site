import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  tone?: "blue" | "teal" | "amber" | "slate";
};

const toneClasses = {
  blue: "bg-blue-50 text-blue-700",
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-700"
};

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  tone = "blue"
}: StatCardProps) {
  return (
    <Card className="min-h-[128px]">
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-md",
              toneClasses[tone]
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <strong className="text-2xl font-bold tracking-normal text-foreground">
            {value}
          </strong>
          {change ? (
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              {change}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
