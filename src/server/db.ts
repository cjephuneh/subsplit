import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma";

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. For Azure PostgreSQL use: postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require",
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
