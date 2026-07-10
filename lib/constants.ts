import type { PipelineStatus, UserRole } from "@/lib/models";

export const pipelineStatuses: PipelineStatus[] = [
  "Bid",
  "Response",
  "Intro",
  "Tech",
  "Culture",
  "Final",
  "Offer",
  "Rejected"
];

export const roleLabels: Record<UserRole, string> = {
  manager: "Manager",
  bidder: "Bidder",
  caller: "Caller",
  developer: "Developer"
};
