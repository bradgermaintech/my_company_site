"use client";

import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  CreditCard,
  KanbanSquare,
  Sparkles,
  UsersRound
} from "lucide-react";
import { HelpTooltip } from "@/components/help-tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { UserRole } from "@/lib/models";

const roleFocusMap: Record<UserRole, string> = {
  manager: "Review every lane, fix assignments, and keep interviews, delivery, and payments aligned.",
  bidder: "Create fresh applications, keep notes accurate, and move opportunities through the early pipeline.",
  caller: "Track who is interview-ready and coordinate scheduling from the pipeline into the calendar.",
  developer: "Watch assigned records, understand stage context, and keep delivery work attached to the right application."
};

const workflowSteps = [
  {
    title: "Create or review applications",
    description: "Start in Pipeline. New records begin at Bid and carry the ownership for bidder, caller, and developer.",
    href: "/pipeline",
    icon: BriefcaseBusiness
  },
  {
    title: "Schedule interview activity",
    description: "Once a company responds, move the stage forward and use Interviews to coordinate the meeting plan.",
    href: "/interviews",
    icon: CalendarCheck2
  },
  {
    title: "Track execution and delivery",
    description: "Use Team to review who owns the technical work and how the application is moving through production tasks.",
    href: "/team",
    icon: UsersRound
  },
  {
    title: "Close the commercial loop",
    description: "Use Payments to watch release readiness and payment status as the opportunity matures.",
    href: "/payments",
    icon: CreditCard
  }
] as const;

export function GettingStartedGuide({ role }: { role: UserRole }) {
  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-teal-50/50 dark:to-teal-950/20">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit gap-2 rounded-full px-3 py-1">
              <Sparkles className="size-3.5" />
              Getting started
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-xl">How to use this platform</CardTitle>
              <CardDescription>{roleFocusMap[role]}</CardDescription>
            </div>
          </div>
          <div className="rounded-lg border bg-background/75 px-4 py-3 text-sm text-muted-foreground">
            Best first step: open <span className="font-semibold text-foreground">Pipeline</span> and work one application from creation to stage update.
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <Link
                key={step.title}
                href={step.href}
                className="rounded-lg border bg-background/75 p-4 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                        Step {index + 1}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border bg-background/75 p-4">
            <div className="flex items-center gap-2">
              <KanbanSquare className="size-4 text-primary" />
              <p className="font-semibold text-foreground">Pipeline stages</p>
              <HelpTooltip content="These stages are the shared language of the agency workflow. Update them as the application moves forward." />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              `Bid` means submitted, `Response` means the company replied, interview stages cover the middle of the process, and `Offer` or `Rejected` closes the lane.
            </p>
          </div>

          <div className="rounded-lg border bg-background/75 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              <p className="font-semibold text-foreground">Daily operating rhythm</p>
            </div>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
              <li>1. Check the dashboard summary.</li>
              <li>2. Open Pipeline and update stages or assignments.</li>
              <li>3. Schedule or review interviews.</li>
              <li>4. Confirm delivery and payment states before closing the day.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
