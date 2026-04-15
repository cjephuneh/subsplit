/*
  Warnings:

  - Made the column `startupLink` on table `StartupApplication` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "StartupApplication" ALTER COLUMN "startupLink" SET NOT NULL;
