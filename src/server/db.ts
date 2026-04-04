import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma";

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. For Azure PostgreSQL use: postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require",
    );
  }
  if (url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL is still set to SQLite (file:...). This app uses PostgreSQL only. In Azure Portal → Web App → Environment variables, replace DATABASE_URL with your Azure Postgres URL (postgresql://...?sslmode=require) and redeploy.",
    );
  }
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error(
      "DATABASE_URL must be a PostgreSQL URL (postgresql:// or postgres://). Current value does not look like Postgres.",
    );
  }
  return url;
}

function createPrismaClient() {
  const connectionString = resolveDatabaseUrl();
  // Pass PoolConfig so we avoid duplicate @types/pg vs adapter's nested pg types.
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
