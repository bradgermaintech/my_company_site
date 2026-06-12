import type {
  Activity,
  DeveloperTask,
  Interview,
  JobApplication,
  PipelineStatus,
  Release,
  ResumeTailor,
  User,
  UserRole
} from "@/lib/models";

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
  admin: "Admin",
  bidder: "Bidder",
  caller: "Caller",
  developer: "Developer"
};

export const users: User[] = [
  {
    id: "user-admin-1",
    name: "Maya Benton",
    email: "maya@pipelineos.dev",
    role: "admin",
    avatar: "MB",
    active: true
  },
  {
    id: "user-bidder-1",
    name: "Jon Bell",
    email: "jon@pipelineos.dev",
    role: "bidder",
    avatar: "JB",
    active: true
  },
  {
    id: "user-bidder-2",
    name: "Sana Mir",
    email: "sana@pipelineos.dev",
    role: "bidder",
    avatar: "SM",
    active: true
  },
  {
    id: "user-caller-1",
    name: "Iris Park",
    email: "iris@pipelineos.dev",
    role: "caller",
    avatar: "IP",
    active: true
  },
  {
    id: "user-caller-2",
    name: "Theo Chen",
    email: "theo@pipelineos.dev",
    role: "caller",
    avatar: "TC",
    active: true
  },
  {
    id: "user-dev-1",
    name: "Nora Singh",
    email: "nora@pipelineos.dev",
    role: "developer",
    avatar: "NS",
    active: true
  },
  {
    id: "user-dev-2",
    name: "Elias Ward",
    email: "elias@pipelineos.dev",
    role: "developer",
    avatar: "EW",
    active: true
  },
  {
    id: "user-dev-3",
    name: "Avery Brooks",
    email: "avery@pipelineos.dev",
    role: "developer",
    avatar: "AB",
    active: true
  }
];

export const applications: JobApplication[] = [
  {
    id: "app-1001",
    date: "2026-06-10",
    jobTitle: "Senior Next.js Platform Engineer",
    company: "BrightLedger",
    jdLink: "https://example.com/jobs/brightledger-nextjs",
    bidderId: "user-bidder-1",
    callerId: "user-caller-1",
    developerId: "user-dev-1",
    status: "Tech",
    resumeVersion: "Next.js SaaS v4",
    releaseStatus: "pending",
    paymentStatus: "pending",
    notes: "Tech round needs examples of multi-tenant billing and app router work.",
    createdAt: "2026-06-03T09:15:00Z",
    updatedAt: "2026-06-10T15:40:00Z"
  },
  {
    id: "app-1002",
    date: "2026-06-09",
    jobTitle: "React Native Commerce Lead",
    company: "Northstar Retail",
    jdLink: "https://example.com/jobs/northstar-mobile",
    bidderId: "user-bidder-2",
    callerId: "user-caller-2",
    developerId: "user-dev-2",
    status: "Intro",
    resumeVersion: "Mobile Lead v2",
    releaseStatus: "not-ready",
    paymentStatus: "unbilled",
    notes: "Caller waiting on client timezone confirmation.",
    createdAt: "2026-06-02T12:00:00Z",
    updatedAt: "2026-06-09T17:12:00Z"
  },
  {
    id: "app-1003",
    date: "2026-06-08",
    jobTitle: "AI Workflow Automation Engineer",
    company: "Atlas Claims",
    jdLink: "https://example.com/jobs/atlas-ai-workflows",
    bidderId: "user-bidder-1",
    callerId: "user-caller-1",
    developerId: "user-dev-3",
    status: "Offer",
    resumeVersion: "AI Workflow v3",
    releaseStatus: "approved",
    paymentStatus: "approved",
    notes: "Release approved after final interview. Payment ready for finance.",
    createdAt: "2026-05-28T10:20:00Z",
    updatedAt: "2026-06-10T18:05:00Z"
  },
  {
    id: "app-1004",
    date: "2026-06-07",
    jobTitle: "Backend API Architect",
    company: "Cedar Health",
    jdLink: "https://example.com/jobs/cedar-api",
    bidderId: "user-bidder-2",
    callerId: "user-caller-2",
    developerId: "user-dev-1",
    status: "Final",
    resumeVersion: "API Platform v5",
    releaseStatus: "pending",
    paymentStatus: "pending",
    notes: "Final round with CTO. Prepare security and uptime stories.",
    createdAt: "2026-05-29T13:30:00Z",
    updatedAt: "2026-06-09T21:22:00Z"
  },
  {
    id: "app-1005",
    date: "2026-06-06",
    jobTitle: "Frontend Design Systems Engineer",
    company: "Meridian Studio",
    jdLink: "https://example.com/jobs/meridian-design-systems",
    bidderId: "user-bidder-1",
    callerId: "user-caller-1",
    developerId: "user-dev-2",
    status: "Response",
    resumeVersion: "Design Systems v2",
    releaseStatus: "not-ready",
    paymentStatus: "unbilled",
    notes: "Positive reply. Caller should book intro before Friday.",
    createdAt: "2026-06-04T08:45:00Z",
    updatedAt: "2026-06-10T11:22:00Z"
  },
  {
    id: "app-1006",
    date: "2026-06-06",
    jobTitle: "DevOps Reliability Consultant",
    company: "HarborGrid",
    jdLink: "https://example.com/jobs/harborgrid-devops",
    bidderId: "user-bidder-2",
    callerId: "user-caller-2",
    developerId: "user-dev-3",
    status: "Bid",
    resumeVersion: "SRE Cloud v1",
    releaseStatus: "not-ready",
    paymentStatus: "unbilled",
    notes: "Submitted with AWS cost-reduction case study.",
    createdAt: "2026-06-06T16:03:00Z",
    updatedAt: "2026-06-06T16:03:00Z"
  },
  {
    id: "app-1007",
    date: "2026-06-04",
    jobTitle: "Full-stack Fintech Engineer",
    company: "Copperline Finance",
    jdLink: "https://example.com/jobs/copperline-fullstack",
    bidderId: "user-bidder-1",
    callerId: "user-caller-2",
    developerId: "user-dev-1",
    status: "Culture",
    resumeVersion: "Fintech Full-stack v3",
    releaseStatus: "pending",
    paymentStatus: "pending",
    notes: "Culture interview requires examples of stakeholder communication.",
    createdAt: "2026-05-25T07:50:00Z",
    updatedAt: "2026-06-10T14:34:00Z"
  },
  {
    id: "app-1008",
    date: "2026-06-02",
    jobTitle: "Laravel Modernization Engineer",
    company: "ScoutWorks",
    jdLink: "https://example.com/jobs/scoutworks-laravel",
    bidderId: "user-bidder-2",
    callerId: "user-caller-1",
    developerId: "user-dev-2",
    status: "Rejected",
    resumeVersion: "PHP Modernization v1",
    releaseStatus: "not-ready",
    paymentStatus: "unbilled",
    notes: "Rejected due to local-only requirement. Keep template for similar remote roles.",
    createdAt: "2026-05-31T15:15:00Z",
    updatedAt: "2026-06-04T12:10:00Z"
  }
];

export const interviews: Interview[] = [
  {
    id: "int-2001",
    applicationId: "app-1001",
    callerId: "user-caller-1",
    developerId: "user-dev-1",
    title: "BrightLedger technical screen",
    stage: "Tech",
    startTime: "2026-06-11T16:00:00Z",
    endTime: "2026-06-11T17:00:00Z",
    meetingLink: "https://meet.example.com/brightledger-tech",
    notes: "Cover RBAC, Prisma, and React Server Components.",
    result: "scheduled"
  },
  {
    id: "int-2002",
    applicationId: "app-1004",
    callerId: "user-caller-2",
    developerId: "user-dev-1",
    title: "Cedar Health final CTO call",
    stage: "Final",
    startTime: "2026-06-12T18:30:00Z",
    endTime: "2026-06-12T19:15:00Z",
    meetingLink: "https://meet.example.com/cedar-final",
    notes: "Prepare system design examples and observability strategy.",
    result: "scheduled"
  },
  {
    id: "int-2003",
    applicationId: "app-1005",
    callerId: "user-caller-1",
    developerId: "user-dev-2",
    title: "Meridian intro call",
    stage: "Intro",
    startTime: "2026-06-13T15:00:00Z",
    endTime: "2026-06-13T15:30:00Z",
    meetingLink: "https://meet.example.com/meridian-intro",
    notes: "Confirm Figma-to-code ownership and design token expectations.",
    result: "scheduled"
  },
  {
    id: "int-2004",
    applicationId: "app-1007",
    callerId: "user-caller-2",
    developerId: "user-dev-1",
    title: "Copperline culture interview",
    stage: "Culture",
    startTime: "2026-06-14T20:00:00Z",
    endTime: "2026-06-14T20:45:00Z",
    meetingLink: "https://meet.example.com/copperline-culture",
    notes: "Discuss remote rituals and product partner communication.",
    result: "scheduled"
  }
];

export const resumeTailors: ResumeTailor[] = [
  {
    id: "tailor-3001",
    applicationId: "app-1001",
    baseResumeText:
      "Senior full-stack engineer with eight years building SaaS platforms in React, Next.js, Node.js, and Postgres.",
    jobDescription:
      "Seeking a senior Next.js engineer for multi-tenant financial operations platform, RBAC, payments, and analytics.",
    tailoredSummary:
      "Senior Next.js platform engineer specializing in multi-tenant SaaS, secure financial workflows, RBAC, analytics, and payment operations.",
    skillMatch:
      "Strong matches: App Router, TypeScript, Postgres, API design, dashboards, payments, release coordination.",
    coverLetter:
      "I can help BrightLedger ship a secure financial workspace with reliable app router architecture, dashboard workflows, and payment-ready release practices.",
    generatedAt: "2026-06-10T10:20:00Z"
  }
];

export const developerTasks: DeveloperTask[] = [
  {
    id: "task-4001",
    developerId: "user-dev-1",
    applicationId: "app-1001",
    title: "Prepare RBAC architecture brief",
    description: "Summarize role matrix, route guards, and audit log approach.",
    status: "todo",
    priority: "high",
    dueDate: "2026-06-11"
  },
  {
    id: "task-4002",
    developerId: "user-dev-1",
    applicationId: "app-1004",
    title: "Draft API modernization plan",
    description: "Outline gateway, versioning, and observability plan for final call.",
    status: "in-progress",
    priority: "urgent",
    dueDate: "2026-06-12"
  },
  {
    id: "task-4003",
    developerId: "user-dev-2",
    applicationId: "app-1005",
    title: "Collect design system screenshots",
    description: "Prepare examples of tokens, component QA, and accessibility review.",
    status: "review",
    priority: "medium",
    dueDate: "2026-06-13"
  },
  {
    id: "task-4004",
    developerId: "user-dev-3",
    applicationId: "app-1003",
    title: "Finalize automation case study",
    description: "Polish workflow automation narrative and measurable outcomes.",
    status: "done",
    priority: "high",
    dueDate: "2026-06-10"
  },
  {
    id: "task-4005",
    developerId: "user-dev-1",
    applicationId: "app-1007",
    title: "Add stakeholder examples",
    description: "Write concise STAR stories for fintech culture interview.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-06-14"
  }
];

export const releases: Release[] = [
  {
    id: "rel-5001",
    applicationId: "app-1003",
    amount: 9600,
    status: "approved",
    approvedBy: "user-admin-1"
  },
  {
    id: "rel-5002",
    applicationId: "app-1001",
    amount: 7200,
    status: "pending",
    approvedBy: "user-admin-1"
  },
  {
    id: "rel-5003",
    applicationId: "app-1004",
    amount: 8400,
    status: "pending",
    approvedBy: "user-admin-1"
  },
  {
    id: "rel-5004",
    applicationId: "app-1007",
    amount: 6800,
    status: "paid",
    approvedBy: "user-admin-1",
    paidAt: "2026-06-09T19:00:00Z"
  }
];

export const activities: Activity[] = [
  {
    id: "act-6001",
    userId: "user-caller-1",
    action: "booked a technical interview",
    target: "BrightLedger",
    timestamp: "2026-06-10T18:20:00Z"
  },
  {
    id: "act-6002",
    userId: "user-admin-1",
    action: "approved release",
    target: "Atlas Claims",
    timestamp: "2026-06-10T17:02:00Z"
  },
  {
    id: "act-6003",
    userId: "user-bidder-1",
    action: "generated a tailored resume",
    target: "BrightLedger",
    timestamp: "2026-06-10T15:15:00Z"
  },
  {
    id: "act-6004",
    userId: "user-dev-1",
    action: "updated delivery notes",
    target: "Cedar Health",
    timestamp: "2026-06-10T13:42:00Z"
  },
  {
    id: "act-6005",
    userId: "user-caller-2",
    action: "moved application to culture stage",
    target: "Copperline Finance",
    timestamp: "2026-06-10T12:18:00Z"
  }
];

export function getUser(id: string) {
  return users.find((user) => user.id === id);
}

export function getApplication(id: string) {
  return applications.find((application) => application.id === id);
}

export function getUsersByRole(role: UserRole) {
  return users.filter((user) => user.role === role && user.active);
}
