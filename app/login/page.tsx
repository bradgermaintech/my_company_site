import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const roles = [
  {
    label: "Admin",
    description: "Monitor performance, releases, payments, and the full agency pipeline.",
    href: "/dashboard/admin"
  },
  {
    label: "Bidder",
    description: "Tailor resumes, track bids, and keep follow-ups moving.",
    href: "/dashboard/bidder"
  },
  {
    label: "Caller",
    description: "Schedule interviews, coordinate candidates, and manage calendar flow.",
    href: "/dashboard/caller"
  },
  {
    label: "Developer",
    description: "Review assigned projects, tasks, deadlines, and delivery updates.",
    href: "/dashboard/developer"
  }
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex flex-col justify-between border-r bg-slate-50 p-6 lg:p-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              PO
            </span>
            <span className="text-lg font-bold tracking-normal">PipelineOS</span>
          </Link>

          <div className="py-12">
            <h1 className="max-w-xl text-4xl font-bold tracking-normal text-slate-950 lg:text-5xl">
              Choose the workspace that matches your agency role.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Mock authentication keeps this prototype fast while preserving the role-based product flow.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Built for internal agency operations, not public job bidding.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 lg:p-10">
          <div className="grid w-full max-w-4xl gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Use any email to preview the management workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="email" type="email" defaultValue="maya@pipelineos.dev" className="pl-9" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="password" type="password" defaultValue="pipelineos" className="pl-9" />
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/dashboard/admin">
                      Continue to admin
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              {roles.map((role) => (
                <Link
                  key={role.label}
                  href={role.href}
                  className="rounded-lg border bg-white p-4 shadow-line transition-colors hover:border-primary hover:bg-blue-50/40"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">{role.label}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
