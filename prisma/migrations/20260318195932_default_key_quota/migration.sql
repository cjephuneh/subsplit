-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'PRODUCTION',
    "label" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "quotaCents" INTEGER NOT NULL DEFAULT 1000,
    "usedCents" INTEGER NOT NULL DEFAULT 0,
    "defaultModelKey" TEXT,
    "lastUsedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ApiKey" ("createdAt", "defaultModelKey", "environment", "id", "keyHash", "label", "lastUsedAt", "prefix", "quotaCents", "revokedAt", "usedCents", "userId") SELECT "createdAt", "defaultModelKey", "environment", "id", "keyHash", "label", "lastUsedAt", "prefix", "quotaCents", "revokedAt", "usedCents", "userId" FROM "ApiKey";
DROP TABLE "ApiKey";
ALTER TABLE "new_ApiKey" RENAME TO "ApiKey";
CREATE INDEX "ApiKey_userId_createdAt_idx" ON "ApiKey"("userId", "createdAt");
CREATE INDEX "ApiKey_prefix_idx" ON "ApiKey"("prefix");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
