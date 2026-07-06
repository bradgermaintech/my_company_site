import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { applicationInputSchema } from "@/lib/application-schema";
import { stageDescriptions } from "@/lib/pipeline-workflow";
import type { JobApplication, UserRole } from "@/lib/models";

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
    releaseStatus: application.releaseStatus === "not_ready" ? "not-ready" : application.releaseStatus,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString()
  };
}

async function validateAssignments(input: {
  bidderId: string;
  callerId: string;
  developerId: string;
}) {
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: [input.bidderId, input.callerId, input.developerId]
      }
    },
    select: {
      id: true,
      role: true,
      active: true
    }
  });

  const userMap = new Map(users.map((user) => [user.id, user]));

  const requiredAssignments: Array<{
    field: keyof typeof input;
    role: UserRole;
    label: string;
  }> = [
    { field: "bidderId", role: "bidder", label: "bidder owner" },
    { field: "callerId", role: "caller", label: "caller owner" },
    { field: "developerId", role: "developer", label: "developer owner" }
  ];

  for (const assignment of requiredAssignments) {
    const user = userMap.get(input[assignment.field]);

    if (!user || !user.active || user.role !== assignment.role) {
      return `Choose an active ${assignment.label}.`;
    }
  }

  return null;
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to create applications." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "bidder") {
    return NextResponse.json({ error: "You do not have permission to create applications." }, { status: 403 });
  }

  const parsed = applicationInputSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid application payload." },
      { status: 400 }
    );
  }

  const input = parsed.data;

  if (input.status !== "Bid") {
    return NextResponse.json(
      {
        error: `New applications must start in Bid. ${stageDescriptions.Bid}`
      },
      { status: 400 }
    );
  }

  const assignmentError = await validateAssignments(input);

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError }, { status: 400 });
  }

  if (session.user.role === "bidder" && input.bidderId !== session.user.id) {
    return NextResponse.json(
      { error: "Bidder accounts can only create applications under their own ownership." },
      { status: 403 }
    );
  }

  const now = new Date();
  const application = await prisma.application.create({
    data: {
      id: `app-${crypto.randomUUID()}`,
      date: new Date(input.date),
      jobTitle: input.jobTitle,
      company: input.company,
      jdLink: input.jdLink,
      bidderId: input.bidderId,
      callerId: input.callerId,
      developerId: input.developerId,
      status: input.status,
      resumeVersion: input.resumeVersion,
      releaseStatus: input.releaseStatus === "not-ready" ? "not_ready" : input.releaseStatus,
      paymentStatus: input.paymentStatus,
      notes: input.notes,
      createdAt: now,
      updatedAt: now
    }
  });

  await prisma.activity.create({
    data: {
      id: `act-${crypto.randomUUID()}`,
      userId: session.user.id,
      action: "Created application",
      target: `${input.company} - ${input.jobTitle}`,
      timestamp: now
    }
  });

  return NextResponse.json(serializeApplication(application), { status: 201 });
}
