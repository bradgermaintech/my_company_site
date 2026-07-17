-- Attach resume packages directly to their owner so tailoring can precede an application.
ALTER TABLE "ResumeTailor" ADD COLUMN "userId" TEXT;
ALTER TABLE "ResumeTailor" ADD COLUMN "structuredResult" JSONB;
ALTER TABLE "ResumeTailor" ADD COLUMN "sourceFileName" TEXT;
ALTER TABLE "ResumeTailor" ADD COLUMN "sourceFileType" TEXT;
ALTER TABLE "ResumeTailor" ADD COLUMN "model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash';
ALTER TABLE "ResumeTailor" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "ResumeTailor" AS tailor
SET "userId" = application."bidderId"
FROM "Application" AS application
WHERE tailor."applicationId" = application."id";

ALTER TABLE "ResumeTailor" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "ResumeTailor" ALTER COLUMN "applicationId" DROP NOT NULL;

ALTER TABLE "ResumeTailor" DROP CONSTRAINT "ResumeTailor_applicationId_fkey";
ALTER TABLE "ResumeTailor" ADD CONSTRAINT "ResumeTailor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumeTailor" ADD CONSTRAINT "ResumeTailor_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ResumeTailor_userId_generatedAt_idx" ON "ResumeTailor"("userId", "generatedAt");
