import { z } from "zod";

export const pipelineStatusOptions = [
  "Bid",
  "Response",
  "Intro",
  "Tech",
  "Culture",
  "Final",
  "Offer",
  "Rejected"
] as const;

export const releaseStatusOptions = [
  "not-ready",
  "pending",
  "approved",
  "released"
] as const;

export const paymentStatusOptions = [
  "unbilled",
  "pending",
  "approved",
  "paid"
] as const;

export const applicationInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD for the application date."),
  jobTitle: z.string().min(3, "Add a job title.").max(140, "Keep the job title under 140 characters."),
  company: z.string().min(2, "Add a company name.").max(120, "Keep the company name under 120 characters."),
  jdLink: z.string().url("Enter a valid job description URL."),
  bidderId: z.string().min(1, "Choose the bidder owner."),
  callerId: z.string().min(1, "Choose the caller owner."),
  developerId: z.string().min(1, "Choose the developer owner."),
  status: z.enum(pipelineStatusOptions),
  resumeVersion: z.string().min(2, "Add the resume version used.").max(40, "Keep the resume version compact."),
  releaseStatus: z.enum(releaseStatusOptions),
  paymentStatus: z.enum(paymentStatusOptions),
  notes: z.string().min(10, "Add a short workflow note.").max(2000, "Keep notes under 2000 characters.")
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;
