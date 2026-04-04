/**
 * One-time copy of data from a local SQLite dev.db into PostgreSQL (e.g. Azure).
 *
 * Prerequisites:
 * 1. PostgreSQL schema is already applied: `DATABASE_URL=... npx prisma migrate deploy`
 * 2. Set SQLITE_SOURCE path to your SQLite file (default: dev.db in project root)
 * 3. Set DATABASE_URL in `.env` (Azure usually needs ?sslmode=require)
 *
 * Run:  npx tsx scripts/migrate-sqlite-to-postgres.ts
 */
import "dotenv/config";
import Database from "better-sqlite3";

import { prisma } from "../src/server/db";

function sqlitePath() {
  const raw = process.env.SQLITE_SOURCE ?? "dev.db";
  return raw.replace(/^file:/, "");
}

function tableExists(db: InstanceType<typeof Database>, name: string) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name) as { name: string } | undefined;
  return Boolean(row);
}

function parseRow(row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row };
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === "bigint") out[k] = Number(v);
    if (k === "createdAt" || k === "updatedAt" || k === "readAt" || k === "lastUsedAt" || k === "revokedAt") {
      if (typeof v === "string" || typeof v === "number") out[k] = new Date(v);
    }
    if (typeof v === "number" && (k === "isAdmin" || k.startsWith("supports"))) {
      out[k] = Boolean(v);
    }
  }
  return out;
}

async function main() {
  const pgUrl = process.env.DATABASE_URL;
  if (!pgUrl || !pgUrl.startsWith("postgresql")) {
    throw new Error("Set DATABASE_URL to a postgresql://... connection string in your environment.");
  }

  const path = sqlitePath();
  const sqlite = new Database(path, { readonly: true, fileMustExist: true });

  try {
    console.log("Reading SQLite:", path);

    if (tableExists(sqlite, "User")) {
      const rows = sqlite.prepare(`SELECT * FROM "User"`).all() as Record<string, unknown>[];
      for (const r of rows) {
        const d = parseRow(r) as {
          id: string;
          email: string;
          displayName: string;
          passwordHash: string;
          isAdmin: boolean;
          preferredCurrency: string;
          createdAt: Date;
          updatedAt: Date;
        };
        await prisma.user.upsert({
          where: { id: d.id },
          create: d,
          update: {
            email: d.email,
            displayName: d.displayName,
            passwordHash: d.passwordHash,
            isAdmin: d.isAdmin,
            preferredCurrency: d.preferredCurrency,
            updatedAt: d.updatedAt,
          },
        });
      }
      console.log("User:", rows.length);
    }

    if (tableExists(sqlite, "CreditWallet")) {
      const rows = sqlite.prepare(`SELECT * FROM "CreditWallet"`).all() as Record<string, unknown>[];
      for (const r of rows) {
        const d = parseRow(r) as {
          id: string;
          userId: string;
          balanceCents: number;
          lowBalanceCentsThreshold: number;
          createdAt: Date;
          updatedAt: Date;
        };
        await prisma.creditWallet.upsert({
          where: { id: d.id },
          create: d,
          update: {
            balanceCents: d.balanceCents,
            lowBalanceCentsThreshold: d.lowBalanceCentsThreshold,
            updatedAt: d.updatedAt,
          },
        });
      }
      console.log("CreditWallet:", rows.length);
    }

    if (tableExists(sqlite, "CreditTransaction")) {
      const rows = sqlite.prepare(`SELECT * FROM "CreditTransaction"`).all() as Record<string, unknown>[];
      for (const r of rows) {
        const d = parseRow(r) as {
          id: string;
          walletId: string;
          type: "TOP_UP" | "SPEND" | "LOAN_OUT" | "LOAN_IN" | "REPAY_OUT" | "REPAY_IN" | "ADJUSTMENT";
          amountCents: number;
          modelKey: string | null;
          note: string | null;
          counterpartyUserId: string | null;
          createdAt: Date;
        };
        await prisma.creditTransaction.upsert({
          where: { id: d.id },
          create: d,
          update: {},
        });
      }
      console.log("CreditTransaction:", rows.length);
    }

    if (tableExists(sqlite, "ModelOffering")) {
      const rows = sqlite.prepare(`SELECT * FROM "ModelOffering"`).all() as Record<string, unknown>[];
      for (const r of rows) {
        const d = parseRow(r) as Record<string, unknown>;
        await prisma.modelOffering.upsert({
          where: { key: d.key as string },
          create: d as Parameters<typeof prisma.modelOffering.create>[0]["data"],
          update: d as Record<string, unknown>,
        });
      }
      console.log("ModelOffering:", rows.length);
    }

    if (tableExists(sqlite, "Notification")) {
      const rows = sqlite.prepare(`SELECT * FROM "Notification"`).all() as Record<string, unknown>[];
      for (const r of rows) {
        const d = parseRow(r) as Record<string, unknown>;
        await prisma.notification.upsert({
          where: { id: d.id as string },
          create: d as Parameters<typeof prisma.notification.create>[0]["data"],
          update: {},
        });
      }
      console.log("Notification:", rows.length);
    }

    if (tableExists(sqlite, "ApiKey")) {
      const rows = sqlite.prepare(`SELECT * FROM "ApiKey"`).all() as Record<string, unknown>[];
      for (const r of rows) {
        const d = parseRow(r) as Record<string, unknown>;
        await prisma.apiKey.upsert({
          where: { id: d.id as string },
          create: d as Parameters<typeof prisma.apiKey.create>[0]["data"],
          update: {},
        });
      }
      console.log("ApiKey:", rows.length);
    }

    if (tableExists(sqlite, "ApiKeyUsageLog")) {
      const rows = sqlite.prepare(`SELECT * FROM "ApiKeyUsageLog"`).all() as Record<string, unknown>[];
      for (const r of rows) {
        const d = parseRow(r) as Record<string, unknown>;
        await prisma.apiKeyUsageLog.upsert({
          where: { id: d.id as string },
          create: d as Parameters<typeof prisma.apiKeyUsageLog.create>[0]["data"],
          update: {},
        });
      }
      console.log("ApiKeyUsageLog:", rows.length);
    }

    if (tableExists(sqlite, "Payment")) {
      const rows = sqlite.prepare(`SELECT * FROM "Payment"`).all() as Record<string, unknown>[];
      for (const r of rows) {
        const d = parseRow(r) as Record<string, unknown>;
        await prisma.payment.upsert({
          where: { id: d.id as string },
          create: d as Parameters<typeof prisma.payment.create>[0]["data"],
          update: {},
        });
      }
      console.log("Payment:", rows.length);
    }

    if (tableExists(sqlite, "SupportTicket")) {
      const rows = sqlite.prepare(`SELECT * FROM "SupportTicket"`).all() as Record<string, unknown>[];
      for (const r of rows) {
        const d = parseRow(r) as Record<string, unknown>;
        await prisma.supportTicket.upsert({
          where: { id: d.id as string },
          create: d as Parameters<typeof prisma.supportTicket.create>[0]["data"],
          update: {},
        });
      }
      console.log("SupportTicket:", rows.length);
    }

    if (tableExists(sqlite, "AppConfig")) {
      const rows = sqlite.prepare(`SELECT * FROM "AppConfig"`).all() as Record<string, unknown>[];
      for (const r of rows) {
        const d = parseRow(r) as Record<string, unknown>;
        await prisma.appConfig.upsert({
          where: { key: d.key as string },
          create: d as Parameters<typeof prisma.appConfig.create>[0]["data"],
          update: { value: d.value as string },
        });
      }
      console.log("AppConfig:", rows.length);
    }

    console.log("Done. Data copied to PostgreSQL.");
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
