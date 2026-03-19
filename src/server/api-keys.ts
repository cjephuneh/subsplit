import crypto from "node:crypto";
import { nanoid } from "nanoid";
import { z } from "zod";

import { prisma } from "@/server/db";

export const ApiKeyEnvironmentSchema = z.enum(["PRODUCTION", "SANDBOX"]);
export type ApiKeyEnvironment = z.infer<typeof ApiKeyEnvironmentSchema>;

export type CreatedApiKey = {
  id: string;
  label: string;
  environment: ApiKeyEnvironment;
  prefix: string;
  key: string; // plaintext, only returned at creation time
  quotaCents: number;
  usedCents: number;
  defaultModelKey: string | null;
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function makePrefix(env: ApiKeyEnvironment) {
  return env === "PRODUCTION" ? "ss_live_" : "ss_test_";
}

export async function createApiKey(input: {
  userId: string;
  label: string;
  environment: ApiKeyEnvironment;
  quotaCents?: number;
  defaultModelKey?: string | null;
}): Promise<CreatedApiKey> {
  const key = `${makePrefix(input.environment)}${nanoid(40)}`;
  const prefix = key.slice(0, 12);
  const keyHash = sha256(key);

  const record = await prisma.apiKey.create({
    data: {
      userId: input.userId,
      environment: input.environment,
      label: input.label,
      prefix,
      keyHash,
      quotaCents: input.quotaCents ?? 0,
      usedCents: 0,
      defaultModelKey: input.defaultModelKey ?? null,
    },
    select: { id: true, label: true, environment: true, prefix: true, quotaCents: true, usedCents: true, defaultModelKey: true },
  });

  return {
    id: record.id,
    label: record.label,
    environment: record.environment,
    prefix: record.prefix,
    key,
    quotaCents: record.quotaCents,
    usedCents: record.usedCents,
    defaultModelKey: record.defaultModelKey,
  };
}

export async function authenticateApiKey(authHeader: string | null) {
  if (!authHeader) return null;
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return null;

  const tokenPrefix = token.slice(0, 12);
  const keyHash = sha256(token);

  const key = await prisma.apiKey.findFirst({
    where: { prefix: tokenPrefix, keyHash, revokedAt: null },
    select: { id: true, userId: true, environment: true, quotaCents: true, usedCents: true, defaultModelKey: true },
  });
  if (!key) return null;

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return key;
}

