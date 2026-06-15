import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const resumeTailorSchema = z.object({
  applicationId: z.string().min(1),
  jdLink: z.string().url().nullable(),
  baseResumeText: z.string().min(80),
  jobDescription: z.string().min(80),
  tailoredSummary: z.string().min(20),
  skillMatch: z.string().min(20),
  coverLetter: z.string().min(20)
});

export async function POST(request: Request) {
  const payload = resumeTailorSchema.parse(await request.json());

  const tailor = await prisma.resumeTailor.create({
    data: {
      id: `tailor-${crypto.randomUUID()}`,
      applicationId: payload.applicationId,
      jdLink: payload.jdLink,
      baseResumeText: payload.baseResumeText,
      jobDescription: payload.jobDescription,
      tailoredSummary: payload.tailoredSummary,
      skillMatch: payload.skillMatch,
      coverLetter: payload.coverLetter,
      generatedAt: new Date()
    }
  });

  return NextResponse.json({
    ...tailor,
    generatedAt: tailor.generatedAt.toISOString()
  });
}
