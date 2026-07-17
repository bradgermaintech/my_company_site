export type UserRole = "manager" | "bidder" | "caller" | "developer";

export type PipelineStatus =
  | "Bid"
  | "Response"
  | "Intro"
  | "Tech"
  | "Culture"
  | "Final"
  | "Offer"
  | "Rejected";

export type ReleaseStatus = "not-ready" | "pending" | "approved" | "released";
export type PaymentStatus = "unbilled" | "pending" | "approved" | "paid";
export type InterviewStage = "Intro" | "Tech" | "Culture" | "Final";
export type InterviewResult = "scheduled" | "passed" | "failed" | "reschedule";
export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type ReleasePaymentStatus = "pending" | "approved" | "paid";

export type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
  avatar: string;
  active: boolean;
  lastSeenAt?: string | null;
};

export type JobApplication = {
  id: string;
  date: string;
  jobTitle: string;
  company: string;
  jdLink: string;
  bidderId: string;
  callerId: string;
  developerId: string;
  status: PipelineStatus;
  resumeVersion: string;
  releaseStatus: ReleaseStatus;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Interview = {
  id: string;
  applicationId: string;
  callerId: string;
  developerId: string;
  title: string;
  stage: InterviewStage;
  startTime: string;
  endTime: string;
  meetingLink: string;
  notes: string;
  result: InterviewResult;
  googleEventId?: string | null;
  googleEventUrl?: string | null;
  googleSyncStatus?: string | null;
  googleSyncError?: string | null;
  googleSyncedAt?: string | null;
};

export type ResumeTailor = {
  id: string;
  userId: string;
  applicationId?: string | null;
  jdLink?: string | null;
  baseResumeText: string;
  jobDescription: string;
  tailoredSummary: string;
  skillMatch: string;
  coverLetter: string;
  structuredResult?: unknown;
  sourceFileName?: string | null;
  sourceFileType?: string | null;
  model?: string;
  generatedAt: string;
  updatedAt?: string;
};

export type DeveloperTask = {
  id: string;
  developerId: string;
  applicationId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
};

export type Release = {
  id: string;
  applicationId: string;
  amount: number;
  status: ReleasePaymentStatus;
  approvedBy: string;
  paidAt?: string;
};

export type Activity = {
  id: string;
  userId: string;
  interviewId?: string | null;
  action: string;
  target: string;
  timestamp: string;
};

export type ChatConversation = {
  id: string;
  managerId: string;
  memberId: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  replyToId?: string | null;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  readAt?: string | null;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  reactions?: {
    emoji: string;
    count: number;
    reactedByMe: boolean;
  }[];
};
