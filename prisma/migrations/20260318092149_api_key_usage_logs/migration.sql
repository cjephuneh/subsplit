-- CreateTable
CREATE TABLE "ApiKeyUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKeyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKeyUsageLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApiKeyUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ApiKeyUsageLog_userId_createdAt_idx" ON "ApiKeyUsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiKeyUsageLog_apiKeyId_createdAt_idx" ON "ApiKeyUsageLog"("apiKeyId", "createdAt");
