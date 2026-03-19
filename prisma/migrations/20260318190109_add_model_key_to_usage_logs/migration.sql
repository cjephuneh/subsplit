-- AlterTable
ALTER TABLE "ApiKeyUsageLog" ADD COLUMN "modelKey" TEXT;

-- CreateIndex
CREATE INDEX "ApiKeyUsageLog_modelKey_createdAt_idx" ON "ApiKeyUsageLog"("modelKey", "createdAt");
