import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { syncInterviewToGoogleCalendar } from "@/lib/google-calendar";
import { canCreateInterview } from "@/lib/interview-permissions";
import { interviewInputSchema } from "@/lib/interview-schema";
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

function formatAuditTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to create interviews." }, { status: 401 });
  }

  if (!canCreateInterview({ id: session.user.id, role: session.user.role })) {
    return NextResponse.json({ error: "You do not have permission to create interviews." }, { status: 403 });
  }

  const parsed = interviewInputSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid interview payload." },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const [application, caller, developer] = await Promise.all([
    prisma.application.findUnique({
      where: { id: payload.applicationId },
      select: {
        id: true,
        company: true,
        jobTitle: true,
        bidderId: true,
        callerId: true
      }
    }),
    prisma.user.findUnique({
      where: { id: payload.callerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    }),
    prisma.user.findUnique({
      where: { id: payload.developerId },
      select: {
        id: true,
        name: true,
        email: true,
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
    if (payload.callerId !== session.user.id) {
      return NextResponse.json(
        { error: "Caller accounts can only create interviews under their own ownership." },
        { status: 403 }
      );
    }

    if (application.callerId !== session.user.id) {
      return NextResponse.json(
        { error: "Caller accounts can only schedule interviews for their assigned applications." },
        { status: 403 }
      );
    }
  }

  const bidder = await prisma.user.findUnique({
    where: { id: application.bidderId },
    select: {
      name: true,
      email: true
    }
  });

  const interview = await prisma.interview.create({
    data: {
      id: `int-${crypto.randomUUID()}`,
      applicationId: payload.applicationId,
      callerId: payload.callerId,
      developerId: payload.developerId,
      title: payload.title,
      stage: payload.stage,
      startTime: new Date(payload.startTime),
      endTime: new Date(payload.endTime),
      meetingLink: payload.meetingLink,
      notes: payload.notes,
      result: "scheduled",
      googleSyncStatus: "pending"
    }
  });

  await syncInterviewToGoogleCalendar({
    id: interview.id,
    title: interview.title,
    startTime: interview.startTime,
    endTime: interview.endTime,
    notes: interview.notes,
    meetingLink: interview.meetingLink,
    stage: interview.stage,
    googleEventId: interview.googleEventId,
    caller: {
      id: caller.id,
      email: caller.email,
      name: caller.name
    },
    developer: {
      email: developer.email,
      name: developer.name
    },
    application: {
      company: application.company,
      jobTitle: application.jobTitle,
      bidder: {
        email: bidder?.email ?? "",
        name: bidder?.name ?? "Bidder"
      }
    }
  }).catch(() => null);

  const syncedInterview = await prisma.interview.findUniqueOrThrow({
    where: { id: interview.id }
  });

  const activity = await prisma.activity.create({
    data: {
      id: `act-${crypto.randomUUID()}`,
      userId: session.user.id,
      interviewId: interview.id,
      action: "Scheduled interview",
      target: `${payload.title} on ${formatAuditTime(payload.startTime)}`,
      timestamp: new Date()
    }
  });

  return NextResponse.json({
    interview: serializeInterview(syncedInterview),
    activity: serializeActivity(activity)
  });
}
