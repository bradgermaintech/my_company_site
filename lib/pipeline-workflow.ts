import type { JobApplication, PipelineStatus, User, UserRole } from "@/lib/models";

export const pipelineWorkflowStatuses: PipelineStatus[] = [
  "Bid",
  "Response",
  "Intro",
  "Tech",
  "Culture",
  "Final",
  "Offer",
  "Rejected"
];

export const stageOwners: Record<PipelineStatus, UserRole[]> = {
  Bid: ["bidder", "admin"],
  Response: ["bidder", "caller", "admin"],
  Intro: ["caller", "admin"],
  Tech: ["caller", "developer", "admin"],
  Culture: ["caller", "developer", "admin"],
  Final: ["caller", "admin"],
  Offer: ["admin"],
  Rejected: ["bidder", "caller", "admin"]
};

export const allowedTransitions: Record<PipelineStatus, PipelineStatus[]> = {
  Bid: ["Response", "Rejected"],
  Response: ["Intro", "Rejected"],
  Intro: ["Tech", "Rejected"],
  Tech: ["Culture", "Final", "Rejected"],
  Culture: ["Final", "Offer", "Rejected"],
  Final: ["Offer", "Rejected"],
  Offer: [],
  Rejected: []
};

export const stageDescriptions: Record<PipelineStatus, string> = {
  Bid: "Application is being prepared or has been submitted by the bidder.",
  Response: "The company replied and the caller should qualify or schedule next steps.",
  Intro: "First screening or recruiter/client conversation.",
  Tech: "Technical interview or technical preparation stage.",
  Culture: "Culture, team, or behavioral interview stage.",
  Final: "Final decision, negotiation, or closing stage.",
  Offer: "Offer received. Admin owns commercial and finance workflow.",
  Rejected: "Closed unsuccessful application."
};

export function isAssignedApplicationOwner(
  user: Pick<User, "id" | "role">,
  application: Pick<JobApplication, "bidderId" | "callerId" | "developerId">
) {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "bidder") {
    return application.bidderId === user.id;
  }

  if (user.role === "caller") {
    return application.callerId === user.id;
  }

  return application.developerId === user.id;
}

export function canEditApplicationByWorkflow(
  user: Pick<User, "id" | "role">,
  application: Pick<JobApplication, "bidderId" | "callerId" | "developerId" | "status">
) {
  return (
    stageOwners[application.status].includes(user.role) &&
    isAssignedApplicationOwner(user, application)
  );
}

export function canDeleteApplicationByWorkflow(
  user: Pick<User, "id" | "role">,
  application: Pick<JobApplication, "bidderId">
) {
  return user.role === "admin" || (user.role === "bidder" && application.bidderId === user.id);
}

export function getAllowedNextStatuses(
  user: Pick<User, "id" | "role">,
  application: Pick<JobApplication, "bidderId" | "callerId" | "developerId" | "status">
) {
  if (user.role === "admin") {
    return pipelineWorkflowStatuses;
  }

  if (!canEditApplicationByWorkflow(user, application)) {
    return [application.status];
  }

  const nextStatuses = allowedTransitions[application.status].filter((status) => {
    if (status === "Offer") {
      return false;
    }

    return stageOwners[status].includes(user.role);
  });

  return [application.status, ...nextStatuses];
}

export function validateApplicationWorkflowChange({
  currentApplication,
  nextApplication,
  user
}: {
  currentApplication: Pick<JobApplication, "bidderId" | "callerId" | "developerId" | "status">;
  nextApplication: Pick<JobApplication, "bidderId" | "callerId" | "developerId" | "status">;
  user: Pick<User, "id" | "role">;
}) {
  if (user.role === "admin") {
    return null;
  }

  if (!canEditApplicationByWorkflow(user, currentApplication)) {
    return "Your role does not own this pipeline stage.";
  }

  if (!isAssignedApplicationOwner(user, currentApplication)) {
    return "You can only update applications assigned to your account.";
  }

  if (
    currentApplication.bidderId !== nextApplication.bidderId ||
    currentApplication.callerId !== nextApplication.callerId ||
    currentApplication.developerId !== nextApplication.developerId
  ) {
    return "Only admins can reassign application owners after creation.";
  }

  if (currentApplication.status === nextApplication.status) {
    return null;
  }

  if (!allowedTransitions[currentApplication.status].includes(nextApplication.status)) {
    return `${currentApplication.status} cannot move directly to ${nextApplication.status}.`;
  }

  if (nextApplication.status === "Offer") {
    return "Only admins can move an application to Offer.";
  }

  if (!stageOwners[nextApplication.status].includes(user.role)) {
    return `The ${user.role} role cannot move applications into ${nextApplication.status}.`;
  }

  return null;
}
