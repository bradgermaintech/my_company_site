import "server-only";

import { prisma } from "@/lib/prisma";

type SyncableInterview = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  notes: string;
  meetingLink: string;
  stage: string;
  googleEventId?: string | null;
  caller: { id: string; email: string; name: string };
  developer: { email: string; name: string };
  application: {
    company: string;
    jobTitle: string;
    bidder: { email: string; name: string };
  };
};

type SyncResult = {
  eventId?: string | null;
  eventUrl?: string | null;
  syncedAt?: Date | null;
  status: "synced" | "not_connected" | "disabled" | "error";
  error?: string | null;
};

function getGoogleCalendarConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret, calendarId };
}

async function getGoogleAccount(userId: string) {
  return prisma.account.findFirst({
    where: {
      userId,
      provider: "google"
    },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      expires_at: true
    }
  });
}

async function getValidAccessToken(userId: string) {
  const config = getGoogleCalendarConfig();

  if (!config) {
    return { status: "disabled" as const, token: null };
  }

  const account = await getGoogleAccount(userId);

  if (!account?.access_token) {
    return { status: "not_connected" as const, token: null };
  }

  const expiresSoon = Boolean(
    account.expires_at && account.expires_at * 1000 <= Date.now() + 60_000
  );

  if (!expiresSoon) {
    return { status: "synced" as const, token: account.access_token };
  }

  if (!account.refresh_token) {
    return { status: "not_connected" as const, token: null };
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token
    })
  });

  if (!response.ok) {
    return { status: "error" as const, token: null, error: "Unable to refresh Google access token." };
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };

  if (!payload.access_token) {
    return { status: "error" as const, token: null, error: "Google did not return a usable access token." };
  }

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: payload.access_token,
      expires_at: payload.expires_in
        ? Math.floor(Date.now() / 1000) + payload.expires_in
        : account.expires_at,
      refresh_token: payload.refresh_token ?? account.refresh_token
    }
  });

  return { status: "synced" as const, token: payload.access_token };
}

function buildEventPayload(interview: SyncableInterview) {
  const descriptionLines = [
    `Interview stage: ${interview.stage}`,
    `Candidate/company: ${interview.application.company}`,
    `Role: ${interview.application.jobTitle}`,
    `Meeting link: ${interview.meetingLink}`,
    "",
    interview.notes
  ].filter(Boolean);

  const attendeeMap = new Map(
    [
      interview.caller,
      interview.developer,
      interview.application.bidder
    ]
      .filter((person) => person.email)
      .map((person) => [person.email.toLowerCase(), { email: person.email, displayName: person.name }])
  );

  return {
    summary: interview.title,
    description: descriptionLines.join("\n"),
    location: "Online",
    start: {
      dateTime: interview.startTime.toISOString()
    },
    end: {
      dateTime: interview.endTime.toISOString()
    },
    attendees: Array.from(attendeeMap.values())
  };
}

async function writeSyncState(interviewId: string, result: SyncResult) {
  await prisma.interview.update({
    where: { id: interviewId },
    data: {
      googleEventId: result.eventId ?? null,
      googleEventUrl: result.eventUrl ?? null,
      googleSyncStatus: result.status,
      googleSyncError: result.error ?? null,
      googleSyncedAt: result.syncedAt ?? null
    }
  });
}

export async function syncInterviewToGoogleCalendar(interview: SyncableInterview) {
  const config = getGoogleCalendarConfig();

  if (!config) {
    const result: SyncResult = {
      status: "disabled",
      error: "Google Calendar credentials are not configured."
    };
    await writeSyncState(interview.id, result);
    return result;
  }

  const tokenResult = await getValidAccessToken(interview.caller.id);

  if (!tokenResult.token) {
    const result: SyncResult = {
      status: tokenResult.status,
      error:
        tokenResult.error ??
        "Connect the caller account with Google sign-in to enable calendar sync."
    };
    await writeSyncState(interview.id, result);
    return result;
  }

  const url = interview.googleEventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events/${encodeURIComponent(interview.googleEventId)}?sendUpdates=all`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events?sendUpdates=all`;

  const response = await fetch(url, {
    method: interview.googleEventId ? "PUT" : "POST",
    headers: {
      Authorization: `Bearer ${tokenResult.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildEventPayload(interview))
  });

  if (!response.ok) {
    const errorText = await response.text();
    const result: SyncResult = {
      eventId: interview.googleEventId ?? null,
      status: "error",
      error: `Google Calendar sync failed: ${errorText.slice(0, 220)}`
    };
    await writeSyncState(interview.id, result);
    return result;
  }

  const payload = (await response.json()) as {
    id?: string;
    htmlLink?: string;
  };

  const result: SyncResult = {
    eventId: payload.id ?? interview.googleEventId ?? null,
    eventUrl: payload.htmlLink ?? null,
    syncedAt: new Date(),
    status: "synced",
    error: null
  };
  await writeSyncState(interview.id, result);
  return result;
}

export async function deleteInterviewFromGoogleCalendar(interview: {
  id: string;
  callerId: string;
  googleEventId?: string | null;
}) {
  const config = getGoogleCalendarConfig();

  if (!config || !interview.googleEventId) {
    return { status: config ? "not_connected" : "disabled" } as const;
  }

  const tokenResult = await getValidAccessToken(interview.callerId);

  if (!tokenResult.token) {
    return { status: tokenResult.status, error: tokenResult.error } as const;
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events/${encodeURIComponent(interview.googleEventId)}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${tokenResult.token}`
      }
    }
  );

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    return {
      status: "error" as const,
      error: `Unable to remove Google Calendar event: ${errorText.slice(0, 220)}`
    };
  }

  return { status: "synced" as const };
}
