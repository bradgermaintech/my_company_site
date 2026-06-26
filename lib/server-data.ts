import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type {
  Activity,
  DeveloperTask,
  Interview,
  JobApplication,
  Release,
  ResumeTailor,
  User,
  UserRole
} from "@/lib/models";

function normalizeReleaseStatus(status: "not_ready" | "pending" | "approved" | "released") {
  return status === "not_ready" ? "not-ready" : status;
}

function normalizeTaskStatus(status: "todo" | "in_progress" | "review" | "done") {
  return status === "in_progress" ? "in-progress" : status;
}

function serializeUser(user: User): User {
  return user;
}

function serializeApplication(application: {
  id: string;
  date: Date;
  jobTitle: string;
  company: string;
  jdLink: string;
  bidderId: string;
  callerId: string;
  developerId: string;
  status: JobApplication["status"];
  resumeVersion: string;
  releaseStatus: "not_ready" | "pending" | "approved" | "released";
  paymentStatus: JobApplication["paymentStatus"];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}): JobApplication {
  return {
    ...application,
    date: application.date.toISOString().slice(0, 10),
    releaseStatus: normalizeReleaseStatus(application.releaseStatus),
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString()
  };
}

function serializeInterview(interview: {
  id: string;
  applicationId: string;
  callerId: string;
  developerId: string;
  title: string;
  stage: Interview["stage"];
  startTime: Date;
  endTime: Date;
  meetingLink: string;
  notes: string;
  result: Interview["result"];
<<<<<<< HEAD
  googleEventId: string | null;
  googleEventUrl: string | null;
  googleSyncStatus: string | null;
  googleSyncError: string | null;
  googleSyncedAt: Date | null;
=======
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
}): Interview {
  return {
    ...interview,
    startTime: interview.startTime.toISOString(),
<<<<<<< HEAD
    endTime: interview.endTime.toISOString(),
    googleSyncedAt: interview.googleSyncedAt?.toISOString() ?? null
=======
    endTime: interview.endTime.toISOString()
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
  };
}

function serializeResumeTailor(tailor: {
  id: string;
  applicationId: string;
  baseResumeText: string;
  jobDescription: string;
  tailoredSummary: string;
  skillMatch: string;
  coverLetter: string;
  generatedAt: Date;
}): ResumeTailor {
  return {
    ...tailor,
    generatedAt: tailor.generatedAt.toISOString()
  };
}

function serializeDeveloperTask(task: {
  id: string;
  developerId: string;
  applicationId: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: DeveloperTask["priority"];
  dueDate: Date;
}): DeveloperTask {
  return {
    ...task,
    status: normalizeTaskStatus(task.status),
    dueDate: task.dueDate.toISOString().slice(0, 10)
  };
}

function serializeRelease(release: {
  id: string;
  applicationId: string;
  amount: number;
  status: Release["status"];
  approvedBy: string;
  paidAt: Date | null;
}): Release {
  return {
    ...release,
    paidAt: release.paidAt?.toISOString()
  };
}

function serializeActivity(activity: {
  id: string;
  userId: string;
<<<<<<< HEAD
  interviewId: string | null;
=======
>>>>>>> aa4c91aa4d928027ce6876d5e2316c88f499be4e
  action: string;
  target: string;
  timestamp: Date;
}): Activity {
  return {
    ...activity,
    timestamp: activity.timestamp.toISOString()
  };
}

export const getAgencySnapshot = cache(async () => {
  const [users, applications, interviews, resumeTailors, developerTasks, releases, activities] =
    await Promise.all([
      prisma.user.findMany({ orderBy: { name: "asc" } }),
      prisma.application.findMany({ orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }] }),
      prisma.interview.findMany({ orderBy: { startTime: "asc" } }),
      prisma.resumeTailor.findMany({ orderBy: { generatedAt: "desc" } }),
      prisma.developerTask.findMany({ orderBy: [{ dueDate: "asc" }, { title: "asc" }] }),
      prisma.release.findMany({ orderBy: { amount: "desc" } }),
      prisma.activity.findMany({ orderBy: { timestamp: "desc" } })
    ]);

  return {
    users: users.map(serializeUser),
    applications: applications.map(serializeApplication),
    interviews: interviews.map(serializeInterview),
    resumeTailors: resumeTailors.map(serializeResumeTailor),
    developerTasks: developerTasks.map(serializeDeveloperTask),
    releases: releases.map(serializeRelease),
    activities: activities.map(serializeActivity)
  };
});

export const getPrimaryUserByRole = cache(async (role: UserRole) => {
  const user = await prisma.user.findFirst({
    where: { role, active: true },
    orderBy: { name: "asc" }
  });

  return user ? serializeUser(user) : null;
});
