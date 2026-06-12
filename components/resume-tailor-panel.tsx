"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Link2, Sparkles, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const resumeTailorSchema = z.object({
  baseResumeText: z.string().min(80, "Paste at least a short resume summary."),
  jobDescription: z.string().min(80, "Paste the job description or core requirements."),
  jdLink: z.string().url("Use a valid JD link.").optional().or(z.literal(""))
});

type ResumeTailorForm = z.infer<typeof resumeTailorSchema>;

type GeneratedResume = {
  summary: string;
  skillMatch: string;
  coverLetter: string;
};

const defaultValues: ResumeTailorForm = {
  baseResumeText:
    "Senior full-stack engineer with eight years of experience delivering SaaS products with Next.js, React, TypeScript, Node.js, Postgres, cloud automation, dashboards, integrations, and release coordination.",
  jobDescription:
    "We need a senior software engineer to own a Next.js SaaS platform, build workflow dashboards, integrate payments, improve analytics, collaborate with product stakeholders, and guide production releases.",
  jdLink: "https://example.com/jobs/nextjs-saas-platform"
};

export function ResumeTailorPanel() {
  const [generated, setGenerated] = useState<GeneratedResume | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResumeTailorForm>({
    resolver: zodResolver(resumeTailorSchema),
    defaultValues
  });

  const importedResumeLabel = useMemo(
    () => "Base resume imported: Full-stack SaaS lead profile",
    []
  );

  function onSubmit(values: ResumeTailorForm) {
    const jd = values.jobDescription.toLowerCase();
    const focusAreas = [
      jd.includes("next") ? "Next.js architecture" : "frontend architecture",
      jd.includes("payment") ? "payment workflow delivery" : "workflow automation",
      jd.includes("analytics") ? "analytics dashboards" : "operational dashboards",
      jd.includes("release") ? "release coordination" : "cross-functional delivery"
    ];

    setGenerated({
      summary: `Senior software engineer focused on ${focusAreas.join(", ")} with a track record of shipping production SaaS systems for agency and product teams.`,
      skillMatch: `Strong matches: ${focusAreas.join(" | ")} | TypeScript | API design | stakeholder communication | delivery ownership.`,
      coverLetter:
        "I can help your team turn this role into reliable delivery by combining senior product engineering, clear technical communication, and release-ready execution from the first sprint."
    });
  }

  return (
    <Card>
      <CardHeader className="lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Resume tailoring system</CardTitle>
          <CardDescription>
            Generate role-specific summaries, skill notes, and cover letter drafts from a base resume and JD.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline">
            <Upload className="size-4" aria-hidden="true" />
            Import
          </Button>
          <Button type="submit" form="resume-tailor-form">
            <Sparkles className="size-4" aria-hidden="true" />
            Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form id="resume-tailor-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-dashed bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{importedResumeLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    Upload PDF/DOCX later or paste directly below.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="baseResumeText">Base resume</Label>
              <Textarea id="baseResumeText" {...register("baseResumeText")} />
              {errors.baseResumeText ? (
                <p className="text-sm text-destructive">{errors.baseResumeText.message}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="jobDescription">Job description</Label>
                <Textarea id="jobDescription" {...register("jobDescription")} />
                {errors.jobDescription ? (
                  <p className="text-sm text-destructive">{errors.jobDescription.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="jdLink">JD link</Label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="jdLink" className="pl-9" {...register("jdLink")} />
                </div>
                {errors.jdLink ? (
                  <p className="text-sm text-destructive">{errors.jdLink.message}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <GeneratedBlock
              title="Tailored resume summary"
              value={generated?.summary}
              fallback="Generated summary will appear here after the bidder reviews the JD."
            />
            <GeneratedBlock
              title="Skill match notes"
              value={generated?.skillMatch}
              fallback="The system highlights exact skills to emphasize during the bid."
            />
            <GeneratedBlock
              title="Cover letter draft"
              value={generated?.coverLetter}
              fallback="A concise cover letter draft is produced for fast personalization."
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <Sparkles className="size-4" aria-hidden="true" />
              Generate tailored package
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function GeneratedBlock({
  title,
  value,
  fallback
}: {
  title: string;
  value?: string;
  fallback: string;
}) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {value ?? fallback}
      </p>
    </div>
  );
}
