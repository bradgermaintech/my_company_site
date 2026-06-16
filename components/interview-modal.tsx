"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { HelpTooltip } from "@/components/help-tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  interviewInputSchema,
  interviewStageOptions,
  type InterviewInput
} from "@/lib/interview-schema";
import type { Interview, User, UserRole, JobApplication } from "@/lib/models";

type InterviewModalProps = {
  applications: JobApplication[];
  callers: User[];
  currentUser: Pick<User, "id" | "role">;
  developers: User[];
  interview?: Interview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: InterviewInput) => Promise<void>;
};

function formatDatetimeLocal(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDefaultValues(
  applications: JobApplication[],
  callers: User[],
  developers: User[],
  currentUser: Pick<User, "id" | "role">,
  interview?: Interview | null
): InterviewInput {
  if (interview) {
    return {
      applicationId: interview.applicationId,
      callerId: interview.callerId,
      developerId: interview.developerId,
      title: interview.title,
      stage: interview.stage,
      startTime: formatDatetimeLocal(interview.startTime),
      endTime: formatDatetimeLocal(interview.endTime),
      meetingLink: interview.meetingLink,
      notes: interview.notes
    };
  }

  return {
    applicationId: applications[0]?.id ?? "",
    callerId: currentUser.role === "caller" ? currentUser.id : callers[0]?.id ?? "",
    developerId: developers[0]?.id ?? "",
    title: "Client interview",
    stage: "Intro",
    startTime: "2026-06-15T10:00",
    endTime: "2026-06-15T10:30",
    meetingLink: "https://meet.example.com/new-interview",
    notes: "Confirm candidate context, interviewer expectations, and next steps."
  };
}

function isCallerLocked(role: UserRole) {
  return role === "caller";
}

export function InterviewModal({
  applications,
  callers,
  currentUser,
  developers,
  interview,
  open,
  onOpenChange,
  onSave
}: InterviewModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<InterviewInput>({
    resolver: zodResolver(interviewInputSchema),
    defaultValues: getDefaultValues(applications, callers, developers, currentUser, interview)
  });

  useEffect(() => {
    reset(getDefaultValues(applications, callers, developers, currentUser, interview));
  }, [applications, callers, currentUser, developers, interview, reset]);

  if (!open) {
    return null;
  }

  async function onSubmit(values: InterviewInput) {
    await onSave(values);
    onOpenChange(false);
  }

  const lockedCaller = isCallerLocked(currentUser.role);
  const isEditing = Boolean(interview);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        className="w-full max-w-2xl rounded-lg border bg-white shadow-soft dark:bg-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-modal-title"
      >
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 id="interview-modal-title" className="text-lg font-bold">
              {isEditing ? "Edit interview" : "Add interview"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Update meeting details, ownership, and stage context."
                : "Link the call to an application, assigned team members, and stage notes."}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close interview modal"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Application"
              helpText="Choose the opportunity this interview belongs to."
              error={errors.applicationId?.message}
            >
              <Select id="applicationId" {...register("applicationId")}>
                {applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.company} - {application.jobTitle}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Developer"
              helpText="This is the developer attached to the technical execution side of the interview."
              error={errors.developerId?.message}
            >
              <Select id="developerId" {...register("developerId")}>
                {developers.map((developer) => (
                  <option key={developer.id} value={developer.id}>
                    {developer.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Caller"
              helpText="Caller accounts are locked to their own ownership. Admins can reassign when needed."
              error={errors.callerId?.message}
            >
              <Select id="callerId" {...register("callerId")} disabled={lockedCaller}>
                {callers.map((caller) => (
                  <option key={caller.id} value={caller.id}>
                    {caller.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Stage"
              helpText="Use the interview round that best matches this meeting."
              error={errors.stage?.message}
            >
              <Select id="stage" {...register("stage")}>
                {interviewStageOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_170px]">
            <Field
              label="Title"
              helpText="A short label for the interview card and detail panel."
              error={errors.title?.message}
            >
              <Input id="title" {...register("title")} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Start"
              helpText="Use the actual scheduled start time."
              error={errors.startTime?.message}
            >
              <Input id="startTime" type="datetime-local" {...register("startTime")} />
            </Field>
            <Field
              label="End"
              helpText="End time must be after the start time."
              error={errors.endTime?.message}
            >
              <Input id="endTime" type="datetime-local" {...register("endTime")} />
            </Field>
          </div>

          <Field
            label="Meeting link"
            helpText="Paste the join link so the calendar panel can launch the meeting directly."
            error={errors.meetingLink?.message}
          >
            <Input id="meetingLink" {...register("meetingLink")} />
          </Field>

          <Field
            label="Notes"
            helpText="Capture interview prep, context, or follow-up details for the next teammate."
            error={errors.notes?.message}
          >
            <Textarea id="notes" className="min-h-[140px]" {...register("notes")} />
          </Field>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !applications.length || !developers.length || !callers.length}
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save changes"
                  : "Save interview"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  children,
  error,
  helpText,
  label
}: {
  children: React.ReactNode;
  error?: string;
  helpText?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {helpText ? <HelpTooltip content={helpText} label={`${label} help`} /> : null}
      </div>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
