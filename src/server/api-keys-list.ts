import type { EnrichedApiKey } from "@/types/api-keys";
import { prisma } from "@/server/db";
import { estimateTokensLeft } from "@/server/tokens-left";

export type { EnrichedApiKey };

/**
 * Same enrichment as GET /api/keys/list (wallet + token estimates).
 */
export async function listEnrichedApiKeysForUser(userId: string): Promise<EnrichedApiKey[]> {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      environment: true,
      prefix: true,
      quotaCents: true,
      usedCents: true,
      defaultModelKey: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });

  const modelKeys = Array.from(
    new Set(keys.map((k) => k.defaultModelKey).filter((v): v is string => typeof v === "string" && v.length > 0)),
  );

  const models =
    modelKeys.length > 0
      ? await prisma.modelOffering.findMany({
          where: { key: { in: modelKeys } },
          select: { key: true, inputCentsPer1kTokens: true, outputCentsPer1kTokens: true },
        })
      : [];

  const centsPer1kByModelKey = new Map(
    models.map((m) => [m.key, Math.floor((m.inputCentsPer1kTokens + m.outputCentsPer1kTokens) / 2)]),
  );

  return keys.map((k) => {
    const remainingCents = Math.max(0, k.quotaCents - k.usedCents);
    const centsPer1kTokens = k.defaultModelKey ? centsPer1kByModelKey.get(k.defaultModelKey) ?? null : null;
    const tokensLeft = centsPer1kTokens
      ? estimateTokensLeft({ remainingCents, blendedCentsPer1kTokens: centsPer1kTokens })
      : null;
    return { ...k, remainingCents, tokensLeft };
  });
}
