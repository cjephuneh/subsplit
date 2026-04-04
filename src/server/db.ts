import { env } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma";

/** When DATABASE_URL is missing or still SQLite, use PG* (same as Azure “connection info” fields). */
function postgresUrlFromPgEnv(): string | undefined {
  const host = env.PGHOST?.trim();
  const user = env.PGUSER?.trim();
  const password = env.PGPASSWORD;
  const port = env.PGPORT?.trim() || "5432";
  const database = env.PGDATABASE?.trim() || "postgres";
  if (!host || !user || password === undefined || password === "") {
    return undefined;
  }
  const u = encodeURIComponent(user);
  const p = encodeURIComponent(password);
  return `postgresql://${u}:${p}@${host}:${port}/${database}?sslmode=require`;
}

function resolveDatabaseUrl() {
  // Use `env` from node:process so Next.js does not inline build-time DATABASE_URL.
  let url = env.DATABASE_URL?.trim();
  if (!url || url.startsWith("file:")) {
    const fromPg = postgresUrlFromPgEnv();
    if (fromPg) {
      return fromPg;
    }
  }
  if (!url) {
    throw new Error(
      "DATABASE_URL is required (postgresql://...), or set PGHOST, PGUSER, PGPASSWORD, and optionally PGPORT, PGDATABASE for Azure Postgres.",
    );
  }
  if (url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL is still SQLite (file:...). In Azure → Web App → Environment variables, set DATABASE_URL to your Postgres URL, or remove DATABASE_URL and set PGHOST, PGUSER, PGPASSWORD, PGDATABASE (and PGPORT). Redeploy and restart.",
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
