import type { TailoredResume } from "@/lib/resume-tailoring/schemas";

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isSupported(source: string, value: string | null) {
  if (!value) return true;
  const fact = normalize(value);
  return fact.length < 2 || source.includes(fact);
}

export function findUnsupportedResumeFacts(
  sourceResume: string,
  result: TailoredResume
) {
  const source = normalize(sourceResume);
  const issues: string[] = [];

  result.experience.forEach((item, index) => {
    const facts = [
      ["employer", item.employer],
      ["job title", item.title],
      ["start date", item.startDate],
      ["end date", item.endDate]
    ] as const;

    facts.forEach(([label, value]) => {
      if (!isSupported(source, value)) issues.push(`Experience ${index + 1} ${label}: ${value}`);
    });
  });

  result.education.forEach((item, index) => {
    const facts = [
      ["institution", item.institution],
      ["degree", item.degree],
      ["start date", item.startDate],
      ["end date", item.endDate]
    ] as const;

    facts.forEach(([label, value]) => {
      if (!isSupported(source, value)) issues.push(`Education ${index + 1} ${label}: ${value}`);
    });
  });

  result.certifications.forEach((certification) => {
    if (!isSupported(source, certification)) issues.push(`Certification: ${certification}`);
  });

  return issues;
}
