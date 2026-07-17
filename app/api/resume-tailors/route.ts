import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mapResumeServiceError } from "@/lib/resume-tailoring/errors";
import { findUnsupportedResumeFacts } from "@/lib/resume-tailoring/integrity";
import { buildResumeTailoringPrompt } from "@/lib/resume-tailoring/prompt";
import {
  formatCoverLetter,
  formatSkillMatch,
  resumeTailoringRequestSchema,
  tailoredResumeSchema
} from "@/lib/resume-tailoring/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

function dailyLimit() {
  const configured = Number.parseInt(process.env.RESUME_TAILOR_DAILY_LIMIT ?? "10", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 10;
}

function startOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to tailor a resume." }, { status: 401 });
  }

  if (session.user.role !== "bidder" && session.user.role !== "manager") {
    return NextResponse.json(
      { error: "Resume tailoring is available to bidders and managers." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The resume request is not valid JSON." }, { status: 400 });
  }

  const parsed = resumeTailoringRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Review the resume inputs." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, active: true }
  });

  if (!user?.active) {
    return NextResponse.json({ error: "Your account is not available." }, { status: 403 });
  }

  const input = parsed.data;
  if (input.applicationId) {
    const application = await prisma.application.findUnique({
      where: { id: input.applicationId },
      select: { bidderId: true }
    });

    if (!application || (session.user.role === "bidder" && application.bidderId !== user.id)) {
      return NextResponse.json({ error: "The selected application is not available." }, { status: 403 });
    }
  }

  const limit = dailyLimit();
  const usedToday = await prisma.resumeTailor.count({
    where: { userId: user.id, generatedAt: { gte: startOfUtcDay() } }
  });

  if (usedToday >= limit) {
    return NextResponse.json(
      {
        code: "user_quota",
        error: "You have reached today’s resume generation limit. Please try again tomorrow.",
        retryable: false
      },
      { status: 429 }
    );
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        code: "ai_configuration",
        error: "The AI service is not configured correctly. Please contact support.",
        retryable: false
      },
      { status: 503 }
    );
  }

  const modelName = process.env.RESUME_TAILOR_MODEL?.trim() || "gemini-2.5-flash";

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const generated = await generateText({
      model: google(modelName),
      output: Output.object({
        schema: tailoredResumeSchema,
        name: "tailored_resume_package",
        description: "An ATS-friendly resume and cover-letter package grounded in the source resume."
      }),
      system:
        "You are a careful resume editor. Factual accuracy is more important than matching every job requirement.",
      prompt: buildResumeTailoringPrompt({
        baseResumeText: input.baseResumeText,
        jobDescription: input.jobDescription,
        jdLink: input.jdLink || null
      }),
      temperature: 0.15,
      maxOutputTokens: 7_000,
      maxRetries: 1,
      timeout: { totalMs: 45_000 }
    });

    const result = tailoredResumeSchema.parse(generated.output);
    const unsupportedFacts = findUnsupportedResumeFacts(input.baseResumeText, result);

    if (unsupportedFacts.length) {
      return NextResponse.json(
        {
          code: "invalid_output",
          error: "The AI response could not be validated. Please generate again.",
          retryable: true
        },
        { status: 502 }
      );
    }

    const generatedAt = new Date();
    const tailor = await prisma.resumeTailor.create({
      data: {
        id: `tailor-${crypto.randomUUID()}`,
        userId: user.id,
        applicationId: input.applicationId || null,
        jdLink: input.jdLink || null,
        baseResumeText: input.baseResumeText,
        jobDescription: input.jobDescription,
        tailoredSummary: result.professionalSummary,
        skillMatch: formatSkillMatch(result),
        coverLetter: formatCoverLetter(result),
        structuredResult: result,
        sourceFileName: input.sourceFileName || null,
        sourceFileType: input.sourceFileType || null,
        model: modelName,
        generatedAt
      }
    });

    await prisma.activity.create({
      data: {
        id: `act-${crypto.randomUUID()}`,
        userId: user.id,
        action: "Generated tailored resume",
        target: input.applicationId ? "Linked application" : "Unlinked opportunity",
        timestamp: generatedAt
      }
    });

    return NextResponse.json(
      {
        id: tailor.id,
        applicationId: tailor.applicationId,
        jdLink: tailor.jdLink,
        result,
        generatedAt: tailor.generatedAt.toISOString(),
        updatedAt: tailor.updatedAt.toISOString(),
        quotaRemaining: Math.max(0, limit - usedToday - 1)
      },
      { status: 201 }
    );
  } catch (error) {
    const mapped = mapResumeServiceError(error);
    return NextResponse.json(
      { code: mapped.code, error: mapped.message, retryable: mapped.retryable },
      { status: mapped.status }
    );
  }
}
