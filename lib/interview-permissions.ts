import type { Interview, JobApplication, User, UserRole } from "@/lib/models";

type Actor = Pick<User, "id" | "role">;

export function canCreateInterview(actor: Actor) {
  return actor.role === "manager" || actor.role === "caller";
}

export function canManageInterviewSchedule(actor: Actor, interview: Pick<Interview, "callerId">) {
  return actor.role === "manager" || (actor.role === "caller" && actor.id === interview.callerId);
}

export function canUpdateInterviewResult(
  actor: Actor,
  interview: Pick<Interview, "callerId" | "developerId">
) {
  return (
    actor.role === "manager" ||
    (actor.role === "caller" && actor.id === interview.callerId) ||
    (actor.role === "developer" && actor.id === interview.developerId)
  );
}

export function canDeleteInterview(actor: Actor, interview: Pick<Interview, "callerId">) {
  return canManageInterviewSchedule(actor, interview);
}

export function canViewInterview(
  actor: Pick<User, "id" | "role">,
  interview: Pick<Interview, "callerId" | "developerId">,
  application: Pick<JobApplication, "bidderId">
) {
  if (actor.role === "manager") {
    return true;
  }

  if (actor.role === "caller") {
    return interview.callerId === actor.id;
  }

  if (actor.role === "developer") {
    return interview.developerId === actor.id;
  }

  return application.bidderId === actor.id;
}

export function scopeApplicationsForRole(
  role: UserRole,
  userId: string,
  applications: JobApplication[]
) {
  if (role === "manager") {
    return applications;
  }

  if (role === "bidder") {
    return applications.filter((application) => application.bidderId === userId);
  }

  if (role === "caller") {
    return applications.filter((application) => application.callerId === userId);
  }

  return applications.filter((application) => application.developerId === userId);
}

export function scopeInterviewsForRole(
  role: UserRole,
  userId: string,
  interviews: Interview[],
  applicationsById: Map<string, JobApplication>
) {
  if (role === "manager") {
    return interviews;
  }

  if (role === "caller") {
    return interviews.filter((interview) => interview.callerId === userId);
  }

  if (role === "developer") {
    return interviews.filter((interview) => interview.developerId === userId);
  }

  return interviews.filter((interview) => {
    const application = applicationsById.get(interview.applicationId);
    return application?.bidderId === userId;
  });
}
