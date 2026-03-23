import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "node:fs";
import path from "node:path";

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.WEBSITE_SITE_NAME) return "file:/home/data/subsplit.db";
  return "file:./dev.db";
}

function ensureSqliteParentDirectory(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) return;
  const filePath = databaseUrl.slice("file:".length);
  if (!filePath || filePath === ":memory:") return;
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
}

function createPrismaClient() {
  const url = resolveDatabaseUrl();
  ensureSqliteParentDirectory(url);
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

