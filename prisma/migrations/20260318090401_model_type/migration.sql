-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ModelOffering" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelType" TEXT NOT NULL DEFAULT 'TEXT',
    "creditsPer1kTokensCents" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "supportsChat" BOOLEAN NOT NULL DEFAULT true,
    "supportsImage" BOOLEAN NOT NULL DEFAULT false,
    "supportsVideo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ModelOffering" ("createdAt", "creditsPer1kTokensCents", "description", "imageUrl", "key", "name", "provider", "supportsChat", "supportsImage", "supportsVideo", "updatedAt") SELECT "createdAt", "creditsPer1kTokensCents", "description", "imageUrl", "key", "name", "provider", "supportsChat", "supportsImage", "supportsVideo", "updatedAt" FROM "ModelOffering";
DROP TABLE "ModelOffering";
ALTER TABLE "new_ModelOffering" RENAME TO "ModelOffering";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
