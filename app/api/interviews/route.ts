import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Interview } from "@/lib/models";

const interviewSchema = z.object({
  applicationId: z.string().min(1),
  callerId: z.string().min(1),
  developerId: z.string().min(1),
  title: z.string().min(4),
  stage: z.enum(["Intro", "Tech", "Culture", "Final"]),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  meetingLink: z.string().url(),
  notes: z.string().min(8)
});

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
}): Interview {
  return {
    ...interview,
    startTime: interview.startTime.toISOString(),
    endTime: interview.endTime.toISOString()
  };
}

export async function POST(request: Request) {
  const payload = interviewSchema.parse(await request.json());

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
      result: "scheduled"
    }
  });

  return NextResponse.json(serializeInterview(interview));
}
