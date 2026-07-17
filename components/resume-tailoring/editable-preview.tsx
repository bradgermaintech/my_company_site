"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TailoredResume } from "@/lib/resume-tailoring/schemas";
import { cn } from "@/lib/utils";

type PreviewTab = "resume" | "match" | "letter";

export function EditableResumePreview({
  value,
  onChange
}: {
  value: TailoredResume;
  onChange: (value: TailoredResume) => void;
}) {
  const [tab, setTab] = useState<PreviewTab>("resume");

  function update<K extends keyof TailoredResume>(key: K, next: TailoredResume[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 flex w-full gap-1 rounded-md bg-muted p-1" role="tablist" aria-label="Tailored resume sections">
        {(["resume", "match", "letter"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={cn(
              "h-9 flex-1 rounded px-2 text-sm font-semibold capitalize transition-colors",
              tab === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item === "letter" ? "Cover letter" : item === "match" ? "Skill match" : "Resume"}
          </button>
        ))}
      </div>

      {tab === "resume" ? (
        <div className="flex flex-col gap-5">
          <EditorSection title="Header">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" value={value.contact.fullName ?? ""} onChange={(next) => update("contact", { ...value.contact, fullName: next || null })} />
              <Field label="Headline" value={value.headline} onChange={(next) => update("headline", next)} />
              <Field label="Email" value={value.contact.email ?? ""} onChange={(next) => update("contact", { ...value.contact, email: next || null })} />
              <Field label="Phone" value={value.contact.phone ?? ""} onChange={(next) => update("contact", { ...value.contact, phone: next || null })} />
              <Field label="Location" value={value.contact.location ?? ""} onChange={(next) => update("contact", { ...value.contact, location: next || null })} />
              <Field label="LinkedIn" value={value.contact.linkedIn ?? ""} onChange={(next) => update("contact", { ...value.contact, linkedIn: next || null })} />
              <Field label="Website" value={value.contact.website ?? ""} onChange={(next) => update("contact", { ...value.contact, website: next || null })} />
            </div>
          </EditorSection>

          <EditorSection title="Professional summary">
            <Textarea value={value.professionalSummary} onChange={(event) => update("professionalSummary", event.target.value)} className="min-h-32" />
          </EditorSection>

          <EditorSection title="Core skills">
            <Textarea value={value.coreSkills.join(", ")} onChange={(event) => update("coreSkills", splitCommaList(event.target.value))} className="min-h-20" />
          </EditorSection>

          <EditorSection
            title="Experience"
            action={<Button type="button" variant="outline" size="sm" onClick={() => update("experience", [...value.experience, { employer: "", title: "", location: null, startDate: "", endDate: "", bullets: [""] }])}><Plus className="size-4" />Add</Button>}
          >
            <div className="flex flex-col gap-4">
              {value.experience.map((item, index) => (
                <div key={index} className="rounded-md border p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Role {index + 1}</p>
                    <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" aria-label={`Remove role ${index + 1}`} onClick={() => update("experience", value.experience.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Employer" value={item.employer} onChange={(next) => updateExperience(value, onChange, index, { employer: next })} />
                    <Field label="Title" value={item.title} onChange={(next) => updateExperience(value, onChange, index, { title: next })} />
                    <Field label="Start" value={item.startDate} onChange={(next) => updateExperience(value, onChange, index, { startDate: next })} />
                    <Field label="End" value={item.endDate} onChange={(next) => updateExperience(value, onChange, index, { endDate: next })} />
                  </div>
                  <Label className="mt-3 block" htmlFor={`experience-${index}-bullets`}>Bullets, one per line</Label>
                  <Textarea id={`experience-${index}-bullets`} className="mt-2 min-h-28" value={item.bullets.join("\n")} onChange={(event) => updateExperience(value, onChange, index, { bullets: splitLines(event.target.value) })} />
                </div>
              ))}
            </div>
          </EditorSection>

          <EditorSection title="Education">
            <div className="flex flex-col gap-3">
              {value.education.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
                  <Field label="Institution" value={item.institution} onChange={(next) => updateEducation(value, onChange, index, { institution: next })} />
                  <Field label="Degree" value={item.degree} onChange={(next) => updateEducation(value, onChange, index, { degree: next })} />
                  <Field label="Field" value={item.field ?? ""} onChange={(next) => updateEducation(value, onChange, index, { field: next || null })} />
                  <Field label="Education start" value={item.startDate ?? ""} onChange={(next) => updateEducation(value, onChange, index, { startDate: next || null })} />
                  <Field label="Education end" value={item.endDate ?? ""} onChange={(next) => updateEducation(value, onChange, index, { endDate: next || null })} />
                  <Button type="button" variant="ghost" className="self-end justify-self-start text-destructive" onClick={() => update("education", value.education.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" />Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => update("education", [...value.education, { institution: "", degree: "", field: null, startDate: null, endDate: null }])}><Plus className="size-4" />Add education</Button>
            </div>
          </EditorSection>

          <EditorSection title="Certifications">
            <Textarea className="min-h-20" value={value.certifications.join("\n")} onChange={(event) => update("certifications", splitLines(event.target.value))} />
          </EditorSection>

          <EditorSection
            title="Projects"
            action={<Button type="button" variant="outline" size="sm" onClick={() => update("projects", [...value.projects, { name: "", description: "", technologies: [] }])}><Plus className="size-4" />Add</Button>}
          >
            <div className="flex flex-col gap-3">
              {value.projects.map((project, index) => (
                <div key={index} className="rounded-md border p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={`Project ${index + 1} name`} value={project.name} onChange={(next) => updateProject(value, onChange, index, { name: next })} />
                    <Field label={`Project ${index + 1} technologies`} value={project.technologies.join(", ")} onChange={(next) => updateProject(value, onChange, index, { technologies: splitCommaList(next) })} />
                  </div>
                  <Label className="mt-3 block" htmlFor={`project-${index}-description`}>Description</Label>
                  <Textarea id={`project-${index}-description`} className="mt-2 min-h-20" value={project.description} onChange={(event) => updateProject(value, onChange, index, { description: event.target.value })} />
                  <Button type="button" variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => update("projects", value.projects.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" />Remove project</Button>
                </div>
              ))}
            </div>
          </EditorSection>
        </div>
      ) : null}

      {tab === "match" ? (
        <div className="flex flex-col gap-5">
          <ListEditor title="Matched skills" value={value.matchedSkills} onChange={(next) => update("matchedSkills", next)} comma />
          <ListEditor title="Skill match notes" value={value.skillMatchNotes} onChange={(next) => update("skillMatchNotes", next)} />
          <ListEditor title="Missing requirements" value={value.missingRequirements} onChange={(next) => update("missingRequirements", next)} />
          <ListEditor title="Unsupported by your resume" value={value.unsupportedRequirements} onChange={(next) => update("unsupportedRequirements", next)} />
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-muted-foreground">
            {value.integrityStatement}
          </div>
        </div>
      ) : null}

      {tab === "letter" ? (
        <div className="flex flex-col gap-4">
          <Field label="Greeting" value={value.coverLetter.greeting} onChange={(next) => update("coverLetter", { ...value.coverLetter, greeting: next })} />
          <div>
            <Label htmlFor="cover-letter-body">Body paragraphs</Label>
            <Textarea id="cover-letter-body" className="mt-2 min-h-72" value={value.coverLetter.paragraphs.join("\n\n")} onChange={(event) => update("coverLetter", { ...value.coverLetter, paragraphs: event.target.value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean) })} />
          </div>
          <Field label="Closing" value={value.coverLetter.closing} onChange={(next) => update("coverLetter", { ...value.coverLetter, closing: next })} />
        </div>
      ) : null}
    </div>
  );
}

function EditorSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section><div className="mb-2 flex items-center justify-between gap-3"><h4 className="text-sm font-semibold">{title}</h4>{action}</div>{children}</section>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `resume-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return <div><Label htmlFor={id}>{label}</Label><Input id={id} className="mt-2" value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function ListEditor({ title, value, onChange, comma = false }: { title: string; value: string[]; onChange: (value: string[]) => void; comma?: boolean }) {
  return <EditorSection title={title}><Textarea className="min-h-28" value={value.join(comma ? ", " : "\n")} onChange={(event) => onChange(comma ? splitCommaList(event.target.value) : splitLines(event.target.value))} /></EditorSection>;
}

function splitLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function splitCommaList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function updateExperience(value: TailoredResume, onChange: (value: TailoredResume) => void, index: number, patch: Partial<TailoredResume["experience"][number]>) {
  onChange({ ...value, experience: value.experience.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
}

function updateEducation(value: TailoredResume, onChange: (value: TailoredResume) => void, index: number, patch: Partial<TailoredResume["education"][number]>) {
  onChange({ ...value, education: value.education.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
}

function updateProject(value: TailoredResume, onChange: (value: TailoredResume) => void, index: number, patch: Partial<TailoredResume["projects"][number]>) {
  onChange({ ...value, projects: value.projects.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
}
