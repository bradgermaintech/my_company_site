"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Upload
} from "lucide-react";
import { useRef, useState } from "react";
import { EditableResumePreview } from "@/components/resume-tailoring/editable-preview";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { JobApplication, ResumeTailor } from "@/lib/models";
import {
  resumeTailoringRequestSchema,
  tailoredResumeSchema,
  type TailoredResume
} from "@/lib/resume-tailoring/schemas";
import { cn } from "@/lib/utils";

type SourceFile = { name: string; type: "pdf" | "docx" } | null;
type Notice = { tone: "error" | "success" | "info"; message: string } | null;

type ApiError = {
  error?: string;
  retryable?: boolean;
};

type GenerationResponse = {
  id: string;
  result: TailoredResume;
  quotaRemaining: number;
};

type ExtractionResponse = {
  text: string;
  fileName: string;
  fileType: "pdf" | "docx";
};

type ResumeTailorPanelProps = {
  applications: JobApplication[];
  initialResumeTailors: ResumeTailor[];
};

export function ResumeTailorPanel({
  applications,
  initialResumeTailors
}: ResumeTailorPanelProps) {
  const latest = initialResumeTailors[0];
  const initialResult = tailoredResumeSchema.safeParse(latest?.structuredResult);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [applicationId, setApplicationId] = useState(latest?.applicationId ?? "");
  const [baseResumeText, setBaseResumeText] = useState(latest?.baseResumeText ?? "");
  const [jobDescription, setJobDescription] = useState(latest?.jobDescription ?? "");
  const [jdLink, setJdLink] = useState(latest?.jdLink ?? "");
  const [sourceFile, setSourceFile] = useState<SourceFile>(
    latest?.sourceFileName && (latest.sourceFileType === "pdf" || latest.sourceFileType === "docx")
      ? { name: latest.sourceFileName, type: latest.sourceFileType }
      : null
  );
  const [generated, setGenerated] = useState<TailoredResume | null>(
    initialResult.success ? initialResult.data : null
  );
  const [tailorId, setTailorId] = useState(latest?.id ?? null);
  const [notice, setNotice] = useState<Notice>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  function selectApplication(id: string) {
    setApplicationId(id);
    const application = applications.find((item) => item.id === id);
    if (application?.jdLink && !jdLink) setJdLink(application.jdLink);
  }

  async function importFile(file: File) {
    setNotice(null);
    setIsExtracting(true);
    const formData = new FormData();
    formData.set("file", file);

    try {
      const response = await fetch("/api/resume-tailors/extract", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as ExtractionResponse & ApiError;
      if (!response.ok) throw new Error(payload.error || "The resume could not be imported.");

      setBaseResumeText(payload.text);
      setSourceFile({ name: payload.fileName, type: payload.fileType });
      setNotice({ tone: "success", message: `${payload.fileName} was imported. Review the extracted text before generating.` });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "The resume could not be imported." });
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function generateResume() {
    setNotice(null);
    const request = {
      applicationId: applicationId || null,
      baseResumeText,
      jobDescription,
      jdLink: jdLink || null,
      sourceFileName: sourceFile?.name ?? null,
      sourceFileType: sourceFile?.type ?? null
    };
    const parsed = resumeTailoringRequestSchema.safeParse(request);

    if (!parsed.success) {
      setNotice({ tone: "error", message: parsed.error.issues[0]?.message ?? "Review the resume inputs." });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/resume-tailors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      const payload = (await response.json()) as GenerationResponse & ApiError;
      if (!response.ok) throw new Error(payload.error || "The tailored resume could not be generated.");

      setGenerated(payload.result);
      setTailorId(payload.id);
      setNotice({ tone: "success", message: `Tailored package generated. ${payload.quotaRemaining} generation${payload.quotaRemaining === 1 ? "" : "s"} remaining today.` });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "The tailored resume could not be generated." });
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveResume() {
    if (!generated || !tailorId) return;
    const parsed = tailoredResumeSchema.safeParse(generated);
    if (!parsed.success) {
      setNotice({ tone: "error", message: parsed.error.issues[0]?.message ?? "Review the edited resume." });
      return;
    }

    setNotice(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/resume-tailors/${tailorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: parsed.data })
      });
      const payload = (await response.json()) as ApiError;
      if (!response.ok) throw new Error(payload.error || "The resume changes could not be saved.");
      setNotice({ tone: "success", message: "Your resume edits were saved." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "The resume changes could not be saved." });
    } finally {
      setIsSaving(false);
    }
  }

  async function downloadPdf() {
    if (!generated) return;
    const parsed = tailoredResumeSchema.safeParse(generated);
    if (!parsed.success) {
      setNotice({ tone: "error", message: "Complete the required resume fields before exporting." });
      return;
    }

    setNotice(null);
    setIsExporting(true);
    try {
      const { createResumePdfBlob } = await import("@/components/resume-tailoring/resume-pdf");
      const blob = await createResumePdfBlob(parsed.data);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const candidate = parsed.data.contact.fullName || "candidate";
      anchor.href = url;
      anchor.download = `${candidate.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "candidate"}-tailored-resume.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setNotice({ tone: "error", message: "The PDF could not be rendered. Please review the resume and try again." });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <CardTitle>Resume tailoring system</CardTitle>
          <CardDescription>
            Import a real resume, compare it with the target role, and generate an editable ATS-ready package without inventing experience.
          </CardDescription>
        </div>
        {generated ? (
          <div className="mt-3 flex flex-wrap gap-2 lg:mt-0">
            <Button type="button" variant="outline" onClick={saveResume} disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save edits
            </Button>
            <Button type="button" onClick={downloadPdf} disabled={isExporting}>
              {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Download PDF
            </Button>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="p-0">
        {notice ? <StatusNotice notice={notice} /> : null}
        <div className="grid min-w-0 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex min-w-0 flex-col gap-5 border-b p-5 xl:border-b-0 xl:border-r">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="tailor-application">Application link <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Select id="tailor-application" className="mt-2" value={applicationId} onChange={(event) => selectApplication(event.target.value)}>
                  <option value="">Not linked yet</option>
                  {applications.map((application) => <option key={application.id} value={application.id}>{application.company} - {application.jobTitle}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="tailor-jd-link">Job URL <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <div className="relative mt-2">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="tailor-jd-link" className="pl-9" placeholder="https://company.com/jobs/role" value={jdLink} onChange={(event) => setJdLink(event.target.value)} />
                </div>
              </div>
            </div>

            <div
              onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false); }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files[0];
                if (file) void importFile(file);
              }}
              className={cn("rounded-lg border border-dashed p-4 transition-colors", isDragging ? "border-primary bg-primary/5" : "bg-muted/20")}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><FileText className="size-5" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{sourceFile?.name || "Upload your base resume"}</p>
                    <p className="text-xs leading-5 text-muted-foreground">PDF or DOCX, up to 3 MB. Text is extracted once and remains editable.</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" disabled={isExtracting} onClick={() => fileInputRef.current?.click()}>
                  {isExtracting ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {isExtracting ? "Reading" : "Choose file"}
                </Button>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); }} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <Label htmlFor="base-resume-text">Base resume text</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{baseResumeText.length.toLocaleString()} / 30,000</span>
              </div>
              <Textarea id="base-resume-text" className="min-h-72 resize-y" placeholder="Upload a resume or paste its complete text here." value={baseResumeText} onChange={(event) => setBaseResumeText(event.target.value)} maxLength={30_000} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <Label htmlFor="target-job-description">Target job description</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{jobDescription.length.toLocaleString()} / 25,000</span>
              </div>
              <Textarea id="target-job-description" className="min-h-64 resize-y" placeholder="Paste the complete job description and requirements." value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} maxLength={25_000} />
            </div>

            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">AI suggestions require review. Unsupported requirements are reported, never added as experience.</p>
              <Button type="button" className="shrink-0" onClick={generateResume} disabled={isGenerating || isExtracting}>
                {isGenerating ? <Loader2 className="size-4 animate-spin" /> : generated ? <RefreshCw className="size-4" /> : <Sparkles className="size-4" />}
                {isGenerating ? "Analyzing resume" : generated ? "Generate again" : "Generate package"}
              </Button>
            </div>
          </div>

          <div className="min-w-0 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">Editable preview</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Review every claim before saving or exporting. The PDF contains selectable ATS-friendly text.</p>
            </div>
            {isGenerating ? <GeneratingState /> : generated ? <EditableResumePreview value={generated} onChange={setGenerated} /> : <EmptyPreview />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusNotice({ notice }: { notice: Exclude<Notice, null> }) {
  const Icon = notice.tone === "error" ? AlertCircle : notice.tone === "success" ? CheckCircle2 : FileText;
  return (
    <div className={cn("flex items-start gap-3 border-b px-5 py-3 text-sm", notice.tone === "error" ? "bg-destructive/8 text-destructive" : notice.tone === "success" ? "bg-emerald-500/8 text-emerald-700 dark:text-emerald-300" : "bg-primary/5 text-foreground")} role={notice.tone === "error" ? "alert" : "status"}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{notice.message}</p>
    </div>
  );
}

function GeneratingState() {
  return <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center" aria-live="polite"><span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Loader2 className="size-6 animate-spin" /></span><div><p className="font-semibold">Building the tailored package</p><p className="mt-1 text-sm text-muted-foreground">Checking source facts, role alignment, and ATS structure.</p></div></div>;
}

function EmptyPreview() {
  return <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 p-8 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><FileText className="size-6" /></span><p className="mt-4 font-semibold">Your tailored resume will appear here</p><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Add the complete source resume and job description, then generate a grounded resume, match report, and cover letter.</p></div>;
}
