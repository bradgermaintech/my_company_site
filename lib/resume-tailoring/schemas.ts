import { z } from "zod";

const optionalText = z.string().trim().max(300).nullable();

export const resumeContactSchema = z.object({
  fullName: optionalText,
  email: optionalText,
  phone: optionalText,
  location: optionalText,
  linkedIn: optionalText,
  website: optionalText
});

export const resumeExperienceSchema = z.object({
  employer: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  location: optionalText,
  startDate: z.string().trim().min(1).max(80),
  endDate: z.string().trim().min(1).max(80),
  bullets: z.array(z.string().trim().min(1).max(500)).min(1).max(12)
});

export const resumeEducationSchema = z.object({
  institution: z.string().trim().min(1).max(200),
  degree: z.string().trim().min(1).max(200),
  field: optionalText,
  startDate: optionalText,
  endDate: optionalText
});

export const resumeProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(800),
  technologies: z.array(z.string().trim().min(1).max(80)).max(20)
});

export const tailoredResumeSchema = z.object({
  contact: resumeContactSchema,
  headline: z.string().trim().min(1).max(180),
  professionalSummary: z.string().trim().min(40).max(1800),
  coreSkills: z.array(z.string().trim().min(1).max(100)).min(1).max(35),
  experience: z.array(resumeExperienceSchema).max(20),
  education: z.array(resumeEducationSchema).max(12),
  certifications: z.array(z.string().trim().min(1).max(240)).max(20),
  projects: z.array(resumeProjectSchema).max(15),
  matchedSkills: z.array(z.string().trim().min(1).max(120)).max(30),
  missingRequirements: z.array(z.string().trim().min(1).max(240)).max(30),
  skillMatchNotes: z.array(z.string().trim().min(1).max(400)).max(30),
  unsupportedRequirements: z.array(z.string().trim().min(1).max(300)).max(30),
  coverLetter: z.object({
    greeting: z.string().trim().min(1).max(200),
    paragraphs: z.array(z.string().trim().min(1).max(1200)).min(2).max(7),
    closing: z.string().trim().min(1).max(300)
  }),
  integrityStatement: z.string().trim().min(1).max(500)
});

const httpUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid job URL.")
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
    message: "The job URL must use http or https."
  });

export const resumeTailoringRequestSchema = z.object({
  applicationId: z.string().trim().min(1).nullable().optional(),
  jdLink: z.union([httpUrlSchema, z.literal(""), z.null()]).optional(),
  baseResumeText: z
    .string()
    .trim()
    .min(120, "Add a resume with enough detail to tailor.")
    .max(30_000, "Resume text must be 30,000 characters or fewer."),
  jobDescription: z
    .string()
    .trim()
    .min(80, "Add the job description or its core requirements.")
    .max(25_000, "Job description must be 25,000 characters or fewer."),
  sourceFileName: z.string().trim().max(255).nullable().optional(),
  sourceFileType: z.enum(["pdf", "docx"]).nullable().optional()
});

export const resumeTailoringUpdateSchema = z.object({
  result: tailoredResumeSchema
});

export type TailoredResume = z.infer<typeof tailoredResumeSchema>;
export type ResumeTailoringRequest = z.infer<typeof resumeTailoringRequestSchema>;

export function formatCoverLetter(result: TailoredResume) {
  return [
    result.coverLetter.greeting,
    ...result.coverLetter.paragraphs,
    result.coverLetter.closing
  ].join("\n\n");
}

export function formatSkillMatch(result: TailoredResume) {
  const sections = [
    result.matchedSkills.length ? `Matched: ${result.matchedSkills.join(", ")}` : "",
    result.skillMatchNotes.join(" "),
    result.unsupportedRequirements.length
      ? `Unsupported by the source resume: ${result.unsupportedRequirements.join(", ")}`
      : ""
  ];

  return sections.filter(Boolean).join("\n");
}
