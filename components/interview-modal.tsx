"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applications, getUsersByRole } from "@/lib/data";
import type { Interview, InterviewStage } from "@/lib/models";

const interviewSchema = z.object({
  applicationId: z.string().min(1),
  developerId: z.string().min(1),
  title: z.string().min(4),
  stage: z.enum(["Intro", "Tech", "Culture", "Final"]),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  meetingLink: z.string().url(),
  notes: z.string().min(8)
});

type InterviewForm = z.infer<typeof interviewSchema>;

type InterviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (interview: Interview) => void;
};

export function InterviewModal({
  open,
  onOpenChange,
  onAdd
}: InterviewModalProps) {
  const developers = getUsersByRole("developer");
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<InterviewForm>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      applicationId: applications[0].id,
      developerId: developers[0].id,
      title: "Client interview",
      stage: "Intro",
      startTime: "2026-06-15T10:00",
      endTime: "2026-06-15T10:30",
      meetingLink: "https://meet.example.com/new-interview",
      notes: "Confirm candidate context, interviewer expectations, and next steps."
    }
  });

  if (!open) {
    return null;
  }

  function onSubmit(values: InterviewForm) {
    onAdd({
      id: `int-${Date.now()}`,
      callerId: "user-caller-1",
      developerId: values.developerId,
      applicationId: values.applicationId,
      title: values.title,
      stage: values.stage as InterviewStage,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
      meetingLink: values.meetingLink,
      notes: values.notes,
      result: "scheduled"
    });
    reset();
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        className="w-full max-w-2xl rounded-lg border bg-white shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-modal-title"
      >
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 id="interview-modal-title" className="text-lg font-bold">
              Add interview
            </h2>
            <p className="text-sm text-muted-foreground">
              Link the call to a bidder record, job, developer, and notes.
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="applicationId">Application</Label>
              <Select id="applicationId" {...register("applicationId")}>
                {applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.company} - {application.jobTitle}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="developerId">Developer</Label>
              <Select id="developerId" {...register("developerId")}>
                {developers.map((developer) => (
                  <option key={developer.id} value={developer.id}>
                    {developer.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_170px]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} />
              {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stage">Stage</Label>
              <Select id="stage" {...register("stage")}>
                <option value="Intro">Intro</option>
                <option value="Tech">Tech</option>
                <option value="Culture">Culture</option>
                <option value="Final">Final</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startTime">Start</Label>
              <Input id="startTime" type="datetime-local" {...register("startTime")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endTime">End</Label>
              <Input id="endTime" type="datetime-local" {...register("endTime")} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="meetingLink">Meeting link</Label>
            <Input id="meetingLink" {...register("meetingLink")} />
            {errors.meetingLink ? <p className="text-sm text-destructive">{errors.meetingLink.message}</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} />
            {errors.notes ? <p className="text-sm text-destructive">{errors.notes.message}</p> : null}
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save interview</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
