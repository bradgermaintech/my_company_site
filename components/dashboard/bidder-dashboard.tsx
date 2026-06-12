import { CalendarClock, FileText, Reply, Send, TrendingUp } from "lucide-react";
import { ApplicationTable } from "@/components/application-table";
import { BidderAnalytics } from "@/components/dashboard/bidder-analytics";
import { ResumeTailorPanel } from "@/components/resume-tailor-panel";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { applications } from "@/lib/data";

export function BidderDashboard() {
  const bidderApplications = applications.filter(
    (application) => application.bidderId === "user-bidder-1"
  );
  const responses = bidderApplications.filter(
    (application) => application.status !== "Bid" && application.status !== "Rejected"
  ).length;
  const interviews = bidderApplications.filter((application) =>
    ["Intro", "Tech", "Culture", "Final", "Offer"].includes(application.status)
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active bids" value={bidderApplications.length.toString()} change="+5 this week" icon={Send} tone="blue" />
        <StatCard title="Response rate" value={`${Math.round((responses / bidderApplications.length) * 100)}%`} icon={Reply} tone="teal" />
        <StatCard title="Interviews booked" value={interviews.toString()} icon={CalendarClock} tone="amber" />
        <StatCard title="Resume versions" value="12" icon={FileText} tone="slate" />
      </section>

      <QuickFilters />
      <ResumeTailorPanel />
      <BidderAnalytics applications={bidderApplications} />
      <ApplicationTable data={bidderApplications} title="Bidding states" />
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
