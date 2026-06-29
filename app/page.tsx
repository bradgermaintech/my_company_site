import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Code2,
  CreditCard,
  FileText,
  GitPullRequestArrow,
  LayoutDashboard,
  PhoneCall,
  PlayCircle,
  Sparkles,
  UsersRound
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const roles = [
  {
    title: "Admin",
    description: "Monitor team performance, releases, payments, and every open stage.",
    icon: LayoutDashboard
  },
  {
    title: "Bidder",
    description: "Tailor resumes, track bids, and keep job pipeline follow-ups visible.",
    icon: FileText
  },
  {
    title: "Caller",
    description: "Schedule interviews, coordinate candidates, and work from a calendar workstation.",
    icon: PhoneCall
  },
  {
    title: "Developer",
    description: "View assigned projects, delivery tasks, technical notes, and status expectations.",
    icon: Code2
  }
];

const features = [
  {
    title: "Resume tailoring system",
    description: "Convert base profiles and JDs into targeted summaries, skill notes, and cover letters.",
    icon: Sparkles
  },
  {
    title: "Bidding state analytics",
    description: "See weekly bid volume, response rates, and stage conversion by bidder.",
    icon: BarChart3
  },
  {
    title: "Interview calendar workstation",
    description: "Manage intro, technical, culture, and final rounds in one caller workspace.",
    icon: CalendarClock
  },
  {
    title: "Developer workflow board",
    description: "Track todo, in-progress, review, and done work with linked application context.",
    icon: ClipboardList
  },
  {
    title: "Admin payment and release tracking",
    description: "Approve releases, monitor pending payments, and keep finance status visible.",
    icon: CreditCard
  },
  {
    title: "One-glance agency overview",
    description: "Give leaders a clean command center for agency health and team momentum.",
    icon: UsersRound
  }
];

const metrics = [
  { label: "Active bids", value: "128" },
  { label: "Response rate", value: "42%" },
  { label: "Interviews booked", value: "31" },
  { label: "Releases approved", value: "18" },
  { label: "Revenue pipeline", value: "$184K" }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="relative overflow-hidden">
        <div className="gradient-grid pointer-events-none absolute inset-x-0 top-0 h-[560px]" />
        <div className="container relative grid gap-12 pb-16 pt-16 lg:grid-cols-[0.88fr_1.12fr] lg:pb-20 lg:pt-24">
          <div className="flex flex-col justify-center">
            <h1 className="max-w-4xl text-5xl font-bold tracking-normal text-slate-950 md:text-6xl lg:text-7xl">
              Run your software agency pipeline from bid to delivery.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Unify bidders, callers, developers, interviews, releases, and payments in one professional AlignOps workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">
                  <PlayCircle className="size-4" aria-hidden="true" />
                  View Dashboard
                </Link>
              </Button>
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <RoleWorkflowSection />
      <FeatureSection />
      <MetricsSection />
      <BottomCta />
      <ScrollToTopButton />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-3 sm:h-16 sm:flex-nowrap sm:py-0">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo size="sm" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#product" className="hover:text-foreground">Product</a>
          <a href="#roles" className="hover:text-foreground">Roles</a>
          <a href="#analytics" className="hover:text-foreground">Analytics</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <ThemeToggle compact />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="sm:h-10 sm:px-4 sm:py-2">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function DashboardPreview() {
  return (
    <div className="soft-panel rounded-xl border p-3 shadow-soft">
      <div className="rounded-lg border bg-white shadow-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <p className="text-sm font-bold">Agency command center</p>
            <p className="text-xs text-muted-foreground">Bid to delivery overview</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Admin</span>
            <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">Live pipeline</span>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-4">
          {[
            ["Active bids", "128"],
            ["Response rate", "42%"],
            ["Interviews", "31"],
            ["Revenue", "$184K"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-slate-50 p-3">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 p-4 pt-0 xl:grid-cols-[1fr_0.82fr]">
          <div className="rounded-lg border p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Pipeline stats</p>
              <StatusBadge status="Offer" />
            </div>
            <div className="flex h-32 items-end gap-3">
              {[42, 58, 38, 72, 51, 64, 46, 29].map((height, index) => (
                <div key={index} className="flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-primary"
                    style={{ height: `${height}%`, opacity: 0.48 + index * 0.05 }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-8 gap-3">
              {["Bid", "Res", "Intro", "Tech", "Cult", "Final", "Offer", "No"].map((label) => (
                <span key={label} className="text-center text-[10px] font-medium text-muted-foreground">
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Calendar</p>
                <CalendarClock className="size-4 text-primary" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Intro", "Tech", "Final"].map((stage, index) => (
                  <div key={stage} className="rounded-md bg-slate-50 p-2">
                    <p className="text-xs font-semibold">{stage}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {index + 2} calls
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">Developer tasks</p>
              <div className="mt-3 grid gap-3">
                {["RBAC brief", "API plan", "Culture prep"].map((task, index) => (
                  <div key={task}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{task}</span>
                      <span className="text-muted-foreground">{[72, 48, 86][index]}%</span>
                    </div>
                    <Progress value={[72, 48, 86][index]} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t p-4">
          <div className="grid gap-2 text-xs md:grid-cols-3">
            {[
              ["BrightLedger", "Senior Next.js Platform Engineer", "Tech"],
              ["Atlas Claims", "AI Workflow Automation Engineer", "Offer"],
              ["Cedar Health", "Backend API Architect", "Final"]
            ].map(([company, role, status]) => (
              <div key={company} className="rounded-lg border bg-slate-50 p-3">
                <p className="font-semibold">{company}</p>
                <p className="mt-1 truncate text-muted-foreground">{role}</p>
                <p className="mt-2 font-semibold text-primary">{status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleWorkflowSection() {
  return (
    <section id="roles" className="border-t bg-slate-50 py-20">
      <div className="container">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
            Role-based workflow without handoff confusion.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Each team member gets a focused workspace, while admin keeps the whole agency visible in one command center.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <div key={role.title} className="rounded-lg border bg-white p-5 shadow-line">
                <span className="flex size-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{role.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section id="product" className="py-20">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
              Everything the agency pipeline needs to stay accountable.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              AlignOps keeps bidding, calling, delivery, release approvals, and payment movement in the same operating rhythm.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2" id="analytics">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="rounded-lg border bg-white p-5 shadow-line">
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-bold">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricsSection() {
  return (
    <section className="border-y bg-slate-950 py-16 text-white">
      <div className="container">
        <div className="grid gap-4 md:grid-cols-5">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BottomCta() {
  return (
    <section id="pricing" className="py-20">
      <div className="container">
        <div className="rounded-xl border bg-white p-8 shadow-soft md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Ready for mock data now, production data later
              </div>
              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
                Give every role a professional operating system for agency delivery.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                Start with the dashboard preview, then move through bidder, caller, developer, pipeline, and settings workspaces.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard/admin">
                  <GitPullRequestArrow className="size-4" aria-hidden="true" />
                  View Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
