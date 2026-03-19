import { prisma } from "@/server/db";

export async function writeApiKeyUsageLog(input: {
  apiKeyId: string;
  userId: string;
  method: string;
  path: string;
  status: number;
  modelKey?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const p = prisma as unknown as Record<string, unknown>;
  const delegate = p["apiKeyUsageLog"] as
    | {
      create: (args: {
        data: {
          apiKeyId: string;
          userId: string;
          method: string;
          path: string;
          status: number;
          modelKey?: string | null;
          ip?: string;
          userAgent?: string;
        };
      }) => Promise<unknown>;
    }
    | undefined;

  // If Prisma client isn't regenerated yet, don't crash the API.
  if (!delegate?.create) return;

  await delegate.create({
    data: {
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      method: input.method,
      path: input.path,
      status: input.status,
      modelKey: input.modelKey,
      ip: input.ip ?? undefined,
      userAgent: input.userAgent ?? undefined,
    },
  });
}

