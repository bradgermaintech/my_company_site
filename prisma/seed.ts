import {
  activities,
  applications,
  developerTasks,
  interviews,
  releases,
  resumeTailors,
  users
} from "../lib/data";
import { hashPassword } from "../lib/password";
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.activity.deleteMany();
  await prisma.release.deleteMany();
  await prisma.developerTask.deleteMany();
  await prisma.resumeTailor.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();

  const sharedPasswordHash = await hashPassword("alignops123");

  await prisma.user.createMany({
    data: users.map((user) => ({
      ...user,
      image: null,
      passwordHash: sharedPasswordHash
    }))
  });

  await prisma.application.createMany({
    data: applications.map((application) => ({
      ...application,
      date: new Date(application.date),
      releaseStatus: application.releaseStatus === "not-ready" ? "not_ready" : application.releaseStatus,
      createdAt: new Date(application.createdAt),
      updatedAt: new Date(application.updatedAt)
    }))
  });

  await prisma.interview.createMany({
    data: interviews.map((interview) => ({
      ...interview,
      startTime: new Date(interview.startTime),
      endTime: new Date(interview.endTime)
    }))
  });

  await prisma.resumeTailor.createMany({
    data: resumeTailors.map((tailor) => ({
      ...tailor,
      generatedAt: new Date(tailor.generatedAt)
    }))
  });

  await prisma.developerTask.createMany({
    data: developerTasks.map((task) => ({
      ...task,
      status: task.status === "in-progress" ? "in_progress" : task.status,
      dueDate: new Date(task.dueDate)
    }))
  });

  await prisma.release.createMany({
    data: releases.map((release) => ({
      ...release,
      paidAt: release.paidAt ? new Date(release.paidAt) : null
    }))
  });

  await prisma.activity.createMany({
    data: activities.map((activity) => ({
      ...activity,
      timestamp: new Date(activity.timestamp)
    }))
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
