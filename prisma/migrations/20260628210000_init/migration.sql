-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'bidder', 'caller', 'developer');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('Bid', 'Response', 'Intro', 'Tech', 'Culture', 'Final', 'Offer', 'Rejected');

-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('not_ready', 'pending', 'approved', 'released');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unbilled', 'pending', 'approved', 'paid');

-- CreateEnum
CREATE TYPE "InterviewStage" AS ENUM ('Intro', 'Tech', 'Culture', 'Final');

-- CreateEnum
CREATE TYPE "InterviewResult" AS ENUM ('scheduled', 'passed', 'failed', 'reschedule');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'review', 'done');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "ReleasePaymentStatus" AS ENUM ('pending', 'approved', 'paid');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Pipeline User',
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'bidder',
    "avatar" TEXT NOT NULL DEFAULT 'PO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jdLink" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "status" "PipelineStatus" NOT NULL,
    "resumeVersion" TEXT NOT NULL,
    "releaseStatus" "ReleaseStatus" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage" "InterviewStage" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "meetingLink" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "result" "InterviewResult" NOT NULL,
    "googleEventId" TEXT,
    "googleEventUrl" TEXT,
    "googleSyncStatus" TEXT,
    "googleSyncError" TEXT,
    "googleSyncedAt" TIMESTAMP(3),

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeTailor" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "jdLink" TEXT,
    "baseResumeText" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "tailoredSummary" TEXT NOT NULL,
    "skillMatch" TEXT NOT NULL,
    "coverLetter" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeTailor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperTask" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "priority" "TaskPriority" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ReleasePaymentStatus" NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interviewId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Application_bidderId_status_idx" ON "Application"("bidderId", "status");

-- CreateIndex
CREATE INDEX "Application_callerId_status_idx" ON "Application"("callerId", "status");

-- CreateIndex
CREATE INDEX "Application_developerId_status_idx" ON "Application"("developerId", "status");

-- CreateIndex
CREATE INDEX "Application_status_updatedAt_idx" ON "Application"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Application_company_idx" ON "Application"("company");

-- CreateIndex
CREATE INDEX "Interview_applicationId_startTime_idx" ON "Interview"("applicationId", "startTime");

-- CreateIndex
CREATE INDEX "Interview_callerId_startTime_idx" ON "Interview"("callerId", "startTime");

-- CreateIndex
CREATE INDEX "Interview_developerId_startTime_idx" ON "Interview"("developerId", "startTime");

-- CreateIndex
CREATE INDEX "ResumeTailor_applicationId_generatedAt_idx" ON "ResumeTailor"("applicationId", "generatedAt");

-- CreateIndex
CREATE INDEX "DeveloperTask_developerId_status_idx" ON "DeveloperTask"("developerId", "status");

-- CreateIndex
CREATE INDEX "DeveloperTask_applicationId_status_idx" ON "DeveloperTask"("applicationId", "status");

-- CreateIndex
CREATE INDEX "DeveloperTask_dueDate_idx" ON "DeveloperTask"("dueDate");

-- CreateIndex
CREATE INDEX "Release_applicationId_status_idx" ON "Release"("applicationId", "status");

-- CreateIndex
CREATE INDEX "Release_approvedBy_status_idx" ON "Release"("approvedBy", "status");

-- CreateIndex
CREATE INDEX "Activity_userId_timestamp_idx" ON "Activity"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "Activity_interviewId_timestamp_idx" ON "Activity"("interviewId", "timestamp");

-- CreateIndex
CREATE INDEX "Activity_timestamp_idx" ON "Activity"("timestamp");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeTailor" ADD CONSTRAINT "ResumeTailor_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperTask" ADD CONSTRAINT "DeveloperTask_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperTask" ADD CONSTRAINT "DeveloperTask_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

