export function buildResumeTailoringPrompt(input: {
  baseResumeText: string;
  jobDescription: string;
  jdLink?: string | null;
}) {
  return `Create an ATS-friendly resume package using only the candidate facts below.

NON-NEGOTIABLE FACTUAL RULES
- Never invent employers, roles, dates, education, certifications, projects, metrics, tools, responsibilities, or qualifications.
- Copy every employer, job title, employment start date, and employment end date exactly as written in the source resume.
- Preserve all real work-history entries. You may rewrite bullets for relevance only when the rewritten claim remains supported by the source.
- Do not turn a job requirement into candidate experience.
- Put job requirements not supported by the source resume in unsupportedRequirements and missingRequirements.
- Contact fields not present in the resume must be null.
- Keep language concise, specific, professional, and ATS-readable. Do not use tables, columns, graphics, or keyword stuffing.
- The cover letter must use only supported facts and must not claim unavailable experience.
- The integrityStatement must briefly confirm these constraints were followed.

SOURCE RESUME
<resume>
${input.baseResumeText}
</resume>

TARGET JOB DESCRIPTION
<job_description>
${input.jobDescription}
</job_description>

JOB URL (context only; do not fetch it)
${input.jdLink || "Not provided"}`;
}
