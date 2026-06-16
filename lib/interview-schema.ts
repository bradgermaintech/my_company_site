import { z } from "zod";

export const interviewStageOptions = ["Intro", "Tech", "Culture", "Final"] as const;
export const interviewResultOptions = [
  "scheduled",
  "passed",
  "failed",
  "reschedule"
] as const;

export const interviewInputSchema = z
  .object({
    applicationId: z.string().min(1, "Choose an application."),
    callerId: z.string().min(1, "Choose the caller owner."),
    developerId: z.string().min(1, "Choose the developer owner."),
    title: z.string().min(4, "Add an interview title.").max(120, "Keep the title under 120 characters."),
    stage: z.enum(interviewStageOptions),
    startTime: z.string().min(1, "Add the interview start time."),
    endTime: z.string().min(1, "Add the interview end time."),
    meetingLink: z.string().url("Enter a valid meeting link."),
    notes: z.string().min(8, "Add a short interview note.").max(2000, "Keep notes under 2000 characters.")
  })
  .superRefine((value, context) => {
    const start = new Date(value.startTime);
    const end = new Date(value.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: "Use valid interview dates and times."
      });
      return;
    }

    if (end <= start) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time must be after the start time."
      });
    }
  });

export const interviewResultUpdateSchema = z.object({
  result: z.enum(interviewResultOptions),
  notes: z
    .string()
    .min(8, "Add a short note when updating the interview result.")
    .max(2000, "Keep notes under 2000 characters.")
});

export type InterviewInput = z.infer<typeof interviewInputSchema>;
export type InterviewResultUpdateInput = z.infer<typeof interviewResultUpdateSchema>;
