-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'PRODUCTION',
    "label" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "environment" TEXT NOT NULL DEFAULT 'PRODUCTION',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "phoneNumber" TEXT NOT NULL,
    "creditsCents" INTEGER NOT NULL,
    "metadataJson" TEXT,
    "providerRef" TEXT,
    "merchantRequestId" TEXT,
    "mpesaReceipt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ModelOffering" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "creditsPer1kTokensCents" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "supportsChat" BOOLEAN NOT NULL DEFAULT true,
    "supportsImage" BOOLEAN NOT NULL DEFAULT false,
    "supportsVideo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ModelOffering" ("createdAt", "creditsPer1kTokensCents", "description", "key", "name", "provider", "updatedAt") SELECT "createdAt", "creditsPer1kTokensCents", "description", "key", "name", "provider", "updatedAt" FROM "ModelOffering";
DROP TABLE "ModelOffering";
ALTER TABLE "new_ModelOffering" RENAME TO "ModelOffering";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ApiKey_userId_createdAt_idx" ON "ApiKey"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiKey_prefix_idx" ON "ApiKey"("prefix");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_providerRef_idx" ON "Payment"("providerRef");
