import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import {
  deleteInterviewFromGoogleCalendar,
  syncInterviewToGoogleCalendar
} from "@/lib/google-calendar";
import {
  canDeleteInterview,
  canManageInterviewSchedule,
  canUpdateInterviewResult
} from "@/lib/interview-permissions";
import {
  interviewInputSchema,
  interviewResultUpdateSchema
} from "@/lib/interview-schema";
import { prisma } from "@/lib/prisma";
import type { Interview } from "@/lib/models";

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
  googleEventId: string | null;
  googleEventUrl: string | null;
  googleSyncStatus: string | null;
  googleSyncError: string | null;
  googleSyncedAt: Date | null;
}): Interview {
  return {
    ...interview,
    startTime: interview.startTime.toISOString(),
    endTime: interview.endTime.toISOString(),
    googleSyncedAt: interview.googleSyncedAt?.toISOString() ?? null
  };
}

function serializeActivity(activity: {
  id: string;
  userId: string;
  interviewId: string | null;
  action: string;
  target: string;
  timestamp: Date;
}) {
  return {
    ...activity,
    timestamp: activity.timestamp.toISOString()
  };
}

function formatAuditTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to update interviews." }, { status: 401 });
  }

  const { id } = await context.params;
  const interview = await prisma.interview.findUnique({
    where: { id },
    select: {
      id: true,
      applicationId: true,
      callerId: true,
      developerId: true,
      title: true,
      stage: true,
      startTime: true,
      endTime: true,
      meetingLink: true,
      notes: true,
      result: true,
      googleEventId: true,
      googleEventUrl: true,
      googleSyncStatus: true,
      googleSyncError: true,
      googleSyncedAt: true
    }
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  const payload = await request.json();

  if (payload?.type === "result") {
    if (!canUpdateInterviewResult({ id: session.user.id, role: session.user.role }, interview)) {
      return NextResponse.json(
        { error: "You do not have permission to update interview results." },
        { status: 403 }
      );
    }

    const parsed = interviewResultUpdateSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid interview result update." },
        { status: 400 }
      );
    }

    const updated = await prisma.interview.update({
      where: { id },
      data: {
        result: parsed.data.result,
        notes: parsed.data.notes
      }
    });

    const activity = await prisma.activity.create({
      data: {
        id: `act-${crypto.randomUUID()}`,
        userId: session.user.id,
        interviewId: updated.id,
        action: "Updated interview result",
        target: `${updated.title} -> ${parsed.data.result}`,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      interview: serializeInterview(updated),
      activity: serializeActivity(activity)
    });
  }

  if (!canManageInterviewSchedule({ id: session.user.id, role: session.user.role }, interview)) {
    return NextResponse.json(
      { error: "You do not have permission to edit this interview." },
      { status: 403 }
    );
  }

  const parsed = interviewInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid interview payload." },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const [application, caller, developer] = await Promise.all([
    prisma.application.findUnique({
      where: { id: input.applicationId },
      select: {
        id: true,
        company: true,
        callerId: true
      }
    }),
    prisma.user.findUnique({
      where: { id: input.callerId },
      select: {
        id: true,
        role: true,
        active: true
      }
    }),
    prisma.user.findUnique({
      where: { id: input.developerId },
      select: {
        id: true,
        role: true,
        active: true
      }
    })
  ]);

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (!caller || !caller.active || caller.role !== "caller") {
    return NextResponse.json({ error: "Choose an active caller owner." }, { status: 400 });
  }

  if (!developer || !developer.active || developer.role !== "developer") {
    return NextResponse.json({ error: "Choose an active developer owner." }, { status: 400 });
  }

  if (session.user.role === "caller") {
    if (input.callerId !== session.user.id || application.callerId !== session.user.id) {
      return NextResponse.json(
        { error: "Caller accounts can only keep interviews under their own assigned ownership." },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.interview.update({
    where: { id },
    data: {
      applicationId: input.applicationId,
      callerId: input.callerId,
      developerId: input.developerId,
      title: input.title,
      stage: input.stage,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      meetingLink: input.meetingLink,
      notes: input.notes,
      googleSyncStatus: "pending",
      googleSyncError: null
    }
  });

  const syncedSource = await prisma.interview.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      notes: true,
      meetingLink: true,
      stage: true,
      googleEventId: true,
      caller: {
        select: {
          id: true,
          email: true,
          name: true
        }
      },
      developer: {
        select: {
          email: true,
          name: true
        }
      },
      application: {
        select: {
          company: true,
          jobTitle: true,
          bidder: {
            select: {
              email: true,
              name: true
            }
          }
        }
      }
    }
  });

  await syncInterviewToGoogleCalendar(syncedSource).catch(() => null);

  const syncedInterview = await prisma.interview.findUniqueOrThrow({
    where: { id }
  });

  const activity = await prisma.activity.create({
    data: {
      id: `act-${crypto.randomUUID()}`,
      userId: session.user.id,
      interviewId: updated.id,
      action: "Updated interview schedule",
      target: `${updated.title} -> ${formatAuditTime(input.startTime)}`,
      timestamp: new Date()
    }
  });

  return NextResponse.json({
    interview: serializeInterview(syncedInterview),
    activity: serializeActivity(activity)
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to delete interviews." }, { status: 401 });
  }

  const { id } = await context.params;
  const interview = await prisma.interview.findUnique({
    where: { id },
    select: {
      id: true,
      callerId: true,
      title: true,
      googleEventId: true
    }
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  if (!canDeleteInterview({ id: session.user.id, role: session.user.role }, interview)) {
    return NextResponse.json(
      { error: "You do not have permission to delete this interview." },
      { status: 403 }
    );
  }

  const googleDeleteResult = await deleteInterviewFromGoogleCalendar(interview).catch(() => ({
    status: "error" as const,
    error: "Unable to remove the linked Google Calendar event."
  }));

  await prisma.interview.delete({
    where: { id }
  });

  const activity = await prisma.activity.create({
    data: {
      id: `act-${crypto.randomUUID()}`,
      userId: session.user.id,
      interviewId: null,
      action: "Deleted interview",
      target: `${interview.title} removed from calendar`,
      timestamp: new Date()
    }
  });

  return NextResponse.json({
    id,
    activity: serializeActivity(activity),
    warning:
      googleDeleteResult.status === "error"
        ? googleDeleteResult.error
        : undefined
  });
}
