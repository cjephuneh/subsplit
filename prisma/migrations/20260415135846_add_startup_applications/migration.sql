-- CreateEnum
CREATE TYPE "StartupApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isStartupCredit" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StartupApplication" (
    "id" TEXT NOT NULL,
    "startupName" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "startupStage" TEXT NOT NULL,
    "startupLink" TEXT,
    "founderVideoUrl" TEXT,
    "status" "StartupApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "creditsAllocated" INTEGER NOT NULL DEFAULT 500000,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,

    CONSTRAINT "StartupApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StartupApplication_status_appliedAt_idx" ON "StartupApplication"("status", "appliedAt");

-- CreateIndex
CREATE INDEX "StartupApplication_email_idx" ON "StartupApplication"("email");

-- AddForeignKey
ALTER TABLE "StartupApplication" ADD CONSTRAINT "StartupApplication_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
