import assert from "node:assert/strict";
import test from "node:test";
import { mapResumeServiceError } from "../lib/resume-tailoring/errors";
import {
  getResumeFileType,
  normalizeExtractedText,
  ResumeFileError
} from "../lib/resume-tailoring/file-extraction";
import { findUnsupportedResumeFacts } from "../lib/resume-tailoring/integrity";
import {
  resumeTailoringRequestSchema,
  tailoredResumeSchema,
  type TailoredResume
} from "../lib/resume-tailoring/schemas";

const sourceResume = `
Jordan Lee
jordan@alignops.dev
Senior Engineer, Bright Ledger
January 2021 - Present
Built TypeScript and Next.js SaaS workflows.
State University
Bachelor of Science in Computer Science
AWS Certified Developer
`;

function validResult(): TailoredResume {
  return tailoredResumeSchema.parse({
    contact: {
      fullName: "Jordan Lee",
      email: "jordan@alignops.dev",
      phone: null,
      location: null,
      linkedIn: null,
      website: null
    },
    headline: "Senior TypeScript Engineer",
    professionalSummary: "Senior engineer delivering reliable TypeScript and Next.js SaaS workflows for product teams.",
    coreSkills: ["TypeScript", "Next.js"],
    experience: [{
      employer: "Bright Ledger",
      title: "Senior Engineer",
      location: null,
      startDate: "January 2021",
      endDate: "Present",
      bullets: ["Built TypeScript and Next.js SaaS workflows."]
    }],
    education: [{
      institution: "State University",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: null,
      endDate: null
    }],
    certifications: ["AWS Certified Developer"],
    projects: [],
    matchedSkills: ["TypeScript", "Next.js"],
    missingRequirements: ["Kubernetes"],
    skillMatchNotes: ["The source resume directly supports TypeScript and Next.js."],
    unsupportedRequirements: ["Kubernetes"],
    coverLetter: {
      greeting: "Dear Hiring Team,",
      paragraphs: [
        "I am interested in the senior engineering role.",
        "My source experience includes TypeScript and Next.js SaaS workflows."
      ],
      closing: "Sincerely,\nJordan Lee"
    },
    integrityStatement: "All candidate claims are grounded in the provided resume."
  });
}

test("accepts a complete tailoring request and rejects non-http job URLs", () => {
  const valid = resumeTailoringRequestSchema.safeParse({
    baseResumeText: sourceResume.repeat(2),
    jobDescription: "We need a senior engineer with TypeScript, Next.js, SaaS delivery, and clear product communication.",
    jdLink: "https://example.com/jobs/engineer"
  });
  assert.equal(valid.success, true);

  const invalid = resumeTailoringRequestSchema.safeParse({
    baseResumeText: sourceResume.repeat(2),
    jobDescription: "We need a senior engineer with TypeScript, Next.js, SaaS delivery, and clear product communication.",
    jdLink: "javascript:alert(1)"
  });
  assert.equal(invalid.success, false);
});

test("detects fabricated work-history facts", () => {
  const grounded = validResult();
  assert.deepEqual(findUnsupportedResumeFacts(sourceResume, grounded), []);

  const fabricated: TailoredResume = {
    ...grounded,
    experience: [{ ...grounded.experience[0], employer: "Invented Global" }]
  };
  assert.match(findUnsupportedResumeFacts(sourceResume, fabricated)[0] ?? "", /Invented Global/);
});

test("validates supported file types and practical serverless size limits", () => {
  assert.equal(getResumeFileType({ name: "resume.pdf", type: "application/pdf", size: 1024 }), "pdf");
  assert.equal(
    getResumeFileType({
      name: "resume.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 1024
    }),
    "docx"
  );

  assert.throws(
    () => getResumeFileType({ name: "resume.txt", type: "text/plain", size: 20 }),
    (error) => error instanceof ResumeFileError && error.code === "unsupported_file"
  );
  assert.throws(
    () => getResumeFileType({ name: "resume.pdf", type: "application/pdf", size: 4 * 1024 * 1024 }),
    (error) => error instanceof ResumeFileError && error.code === "file_too_large"
  );
});

test("normalizes extracted text without collapsing paragraphs", () => {
  assert.equal(normalizeExtractedText("Jordan\u0000   Lee\n\n\nEngineer\tNext.js"), "Jordan Lee\n\nEngineer Next.js");
});

test("maps provider failures to safe user-facing errors", () => {
  assert.equal(mapResumeServiceError(new Error("429 RESOURCE_EXHAUSTED")).code, "provider_busy");
  assert.equal(mapResumeServiceError(new Error("504 deadline exceeded")).code, "timeout");
  assert.equal(mapResumeServiceError(new Error("403 API key invalid")).code, "ai_configuration");
  assert.equal(mapResumeServiceError(new Error("fetch failed ECONNRESET")).code, "network");
});
