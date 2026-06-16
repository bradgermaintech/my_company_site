import type { Interview, JobApplication } from "@/lib/models";

const responseStatuses = new Set([
  "Response",
  "Intro",
  "Tech",
  "Culture",
  "Final",
  "Offer"
]);

const interviewStatuses = new Set(["Intro", "Tech", "Culture", "Final", "Offer"]);
const finalStatuses = new Set(["Final", "Offer"]);

function getReferenceDate(dates: string[]) {
  const timestamps = dates
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (!timestamps.length) {
    return new Date();
  }

  return new Date(Math.max(...timestamps));
}

function startOfUtcWeek(date: Date) {
  const next = new Date(date);
  const day = next.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setUTCDate(next.getUTCDate() + diff);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatWeekLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function calculateResponseRate(applications: JobApplication[]) {
  if (!applications.length) {
    return 0;
  }

  return Math.round(
    (applications.filter((application) => responseStatuses.has(application.status)).length /
      applications.length) *
      100
  );
}

export function calculatePassRate(interviews: Interview[]) {
  if (!interviews.length) {
    return 0;
  }

  return Math.round(
    (interviews.filter((interview) => interview.result === "passed").length /
      interviews.length) *
      100
  );
}

export function calculateShowRate(interviews: Interview[]) {
  if (!interviews.length) {
    return 0;
  }

  const completed = interviews.filter((interview) => interview.result !== "reschedule").length;
  return Math.round((completed / interviews.length) * 100);
}

export function countApplicationsInLatestWeek(applications: JobApplication[]) {
  if (!applications.length) {
    return 0;
  }

  const reference = getReferenceDate(applications.map((application) => application.date));
  const weekStart = startOfUtcWeek(reference);
  const weekEnd = addUtcDays(weekStart, 7);

  return applications.filter((application) => {
    const date = new Date(application.date);
    return date >= weekStart && date < weekEnd;
  }).length;
}

export function countInterviewsInLatestWeek(interviews: Interview[]) {
  if (!interviews.length) {
    return 0;
  }

  const reference = getReferenceDate(interviews.map((interview) => interview.startTime));
  const weekStart = startOfUtcWeek(reference);
  const weekEnd = addUtcDays(weekStart, 7);

  return interviews.filter((interview) => {
    const date = new Date(interview.startTime);
    return date >= weekStart && date < weekEnd;
  }).length;
}

export function buildWeeklyBidderSeries(applications: JobApplication[], weeks = 6) {
  if (!applications.length) {
    return [];
  }

  const reference = getReferenceDate(applications.map((application) => application.date));
  const currentWeekStart = startOfUtcWeek(reference);

  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = addUtcDays(currentWeekStart, (index - (weeks - 1)) * 7);
    const weekEnd = addUtcDays(weekStart, 7);
    const inWeek = applications.filter((application) => {
      const date = new Date(application.date);
      return date >= weekStart && date < weekEnd;
    });

    return {
      week: formatWeekLabel(weekStart),
      bids: inWeek.length,
      responses: inWeek.filter((application) => responseStatuses.has(application.status)).length
    };
  });
}

export function buildConversionSeries(applications: JobApplication[]) {
  const total = applications.length || 1;

  return [
    {
      label: "Response",
      value: Math.round(
        (applications.filter((application) => responseStatuses.has(application.status)).length / total) * 100
      )
    },
    {
      label: "Interview",
      value: Math.round(
        (applications.filter((application) => interviewStatuses.has(application.status)).length / total) * 100
      )
    },
    {
      label: "Final",
      value: Math.round(
        (applications.filter((application) => finalStatuses.has(application.status)).length / total) * 100
      )
    },
    {
      label: "Offer",
      value: Math.round(
        (applications.filter((application) => application.status === "Offer").length / total) * 100
      )
    }
  ];
}
