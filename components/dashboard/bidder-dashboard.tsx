import { CalendarClock, FileText, Reply, Send, TrendingUp } from "lucide-react";
import { ApplicationTable } from "@/components/application-table";
import { BidderAnalytics } from "@/components/dashboard/bidder-analytics";
import { ResumeTailorPanel } from "@/components/resume-tailor-panel";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { calculateResponseRate, countApplicationsInLatestWeek } from "@/lib/dashboard-metrics";
import type { Interview, JobApplication, ResumeTailor, User } from "@/lib/models";

type BidderDashboardProps = {
  applications: JobApplication[];
  interviews: Interview[];
=======
import type { JobApplication, ResumeTailor, User } from "@/lib/models";

type BidderDashboardProps = {
  applications: JobApplication[];
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
  resumeTailors: ResumeTailor[];
  userId: string;
  users: User[];
};

export function BidderDashboard({
  applications,
<<<<<<< HEAD
  interviews,
=======
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
  resumeTailors,
  userId,
  users
}: BidderDashboardProps) {
  const bidderApplications = applications.filter((application) => application.bidderId === userId);
  const bidderApplicationIds = new Set(bidderApplications.map((application) => application.id));
  const bidderResumeTailors = resumeTailors.filter((tailor) =>
    bidderApplicationIds.has(tailor.applicationId)
<<<<<<< HEAD
  );
  const bidderInterviews = interviews.filter((interview) =>
    bidderApplicationIds.has(interview.applicationId)
=======
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
  );
  const responseRate = calculateResponseRate(bidderApplications);
  const latestWeekBids = countApplicationsInLatestWeek(bidderApplications);
  const uniqueResumeVersions = new Set(
    bidderApplications.map((application) => application.resumeVersion)
  ).size;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active bids" value={bidderApplications.length.toString()} change={`${latestWeekBids} in latest week`} icon={Send} tone="blue" />
        <StatCard title="Response rate" value={`${responseRate}%`} change={`${bidderInterviews.length} interview records`} icon={Reply} tone="teal" />
        <StatCard title="Interviews booked" value={bidderInterviews.length.toString()} icon={CalendarClock} tone="amber" />
        <StatCard title="Resume versions" value={uniqueResumeVersions.toString()} icon={FileText} tone="slate" />
      </section>

      <QuickFilters />
      <ResumeTailorPanel applications={bidderApplications} initialResumeTailors={bidderResumeTailors} />
      <BidderAnalytics applications={bidderApplications} />
      <ApplicationTable data={bidderApplications} users={users} title="Bidding states" />
    </div>
  );
}

function QuickFilters() {
  const filters = [
    "Today",
    "This Week",
    "This Month",
    "Status",
    "Caller",
    "Release Pending"
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3 shadow-line">
      <div className="mr-2 flex items-center gap-2 text-sm font-semibold">
        <TrendingUp className="size-4 text-primary" aria-hidden="true" />
        Quick filters
      </div>
      {filters.map((filter, index) => (
        <Button key={filter} type="button" variant={index === 1 ? "default" : "outline"} size="sm">
          {filter}
        </Button>
      ))}
    </div>
  );
}
