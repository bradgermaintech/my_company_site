import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Layers3, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/auth";
import { AuthFormPanel } from "@/components/auth/auth-form-panel";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPrimaryDashboardRoute } from "@/lib/auth-routes";

const roleCards = [
  {
    label: "Admin control",
    copy: "Pipeline health, release approvals, team performance, and finance visibility."
  },
  {
    label: "Bid workflow",
    copy: "Resume tailoring, bid tracking, follow-ups, and fast role packaging."
  },
  {
    label: "Interview ops",
    copy: "Google-calendar-style scheduling, developer coordination, and stage movement."
  }
];

export default async function LoginPage() {
  const session = await getServerAuthSession();

  if (session?.user) {
    redirect(getPrimaryDashboardRoute(session.user.role));
  }

  const hasGoogleAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.18),transparent_30%),linear-gradient(180deg,#020617,#0f172a_48%,#020617)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="relative">
        <header className="border-b border-white/10">
          <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between gap-6 px-4 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <BrandLogo dark size="sm" />
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle compact />
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                Back to site
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-[1240px] gap-10 px-4 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-14">
          <section className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur xl:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                Agency operations
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-white lg:text-6xl">
                Secure sign-in for the whole bid-to-delivery workflow.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 lg:text-lg">
                Move from role preview links to a real product login with email/password,
                Google sign-in, and workspace access that follows the authenticated user.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {roleCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <p className="text-sm font-semibold text-white">{card.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{card.copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <PreviewStat
                icon={ShieldCheck}
                title="Protected routes"
                description="Each role lands in its own workspace after authentication."
              />
              <PreviewStat
                icon={CalendarClock}
                title="Connected scheduling"
                description="Interview flows stay tied to the real database and session."
              />
              <PreviewStat
                icon={Layers3}
                title="Shared operations data"
                description="Applications, tasks, releases, and activity stay in one system."
              />
            </div>
          </section>

          <section className="flex items-center justify-center">
            <div className="w-full max-w-[560px]">
              <AuthFormPanel hasGoogleAuth={hasGoogleAuth} />
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 backdrop-blur">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />
                  <p>
                    Seeded local accounts are available right now. Use
                    `maya@pipelineos.dev` with password `pipelineos123` for the seeded admin account.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function PreviewStat({
  icon: Icon,
  title,
  description
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <Icon className="size-4 text-sky-300" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}
