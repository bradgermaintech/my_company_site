import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { applicationInputSchema } from "@/lib/application-schema";
import { prisma } from "@/lib/prisma";
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

function canManageApplication(
  session: NonNullable<Awaited<ReturnType<typeof getServerAuthSession>>>,
  bidderId: string
) {
  return session.user.role === "admin" || (session.user.role === "bidder" && session.user.id === bidderId);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to update applications." }, { status: 401 });
  }

  const { id } = await context.params;
  const application = await prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      bidderId: true
    }
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (!canManageApplication(session, application.bidderId)) {
    return NextResponse.json({ error: "You do not have permission to update this application." }, { status: 403 });
  }

  const parsed = applicationInputSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid application payload." },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const assignmentError = await validateAssignments(input);

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError }, { status: 400 });
  }

  if (session.user.role === "bidder" && input.bidderId !== session.user.id) {
    return NextResponse.json(
      { error: "Bidder accounts must remain assigned to their own application records." },
      { status: 403 }
    );
  }

  const updatedAt = new Date();
  const updated = await prisma.application.update({
    where: { id },
    data: {
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
      updatedAt
    }
  });

  await prisma.activity.create({
    data: {
      id: `act-${crypto.randomUUID()}`,
      userId: session.user.id,
      action: "Updated application",
      target: `${updated.company} - ${updated.jobTitle}`,
      timestamp: updatedAt
    }
  });

  return NextResponse.json(serializeApplication(updated));
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to delete applications." }, { status: 401 });
  }

  const { id } = await context.params;
  const application = await prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      bidderId: true,
      company: true,
      jobTitle: true
    }
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (!canManageApplication(session, application.bidderId)) {
    return NextResponse.json({ error: "You do not have permission to delete this application." }, { status: 403 });
  }

  const deletedAt = new Date();
  await prisma.application.delete({
    where: { id }
  });

  await prisma.activity.create({
    data: {
      id: `act-${crypto.randomUUID()}`,
      userId: session.user.id,
      action: "Deleted application",
      target: `${application.company} - ${application.jobTitle}`,
      timestamp: deletedAt
    }
  });

  return NextResponse.json({ id });
}
