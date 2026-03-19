import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { estimateTokensLeft } from "@/server/tokens-left";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireSessionUser();

    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
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

    const modelKeys = Array.from(new Set(keys.map((k) => k.defaultModelKey).filter(Boolean))) as string[];
        const models = modelKeys.length
          ? await prisma.modelOffering.findMany({
              where: { key: { in: modelKeys } },
              select: { key: true, inputCentsPer1kTokens: true, outputCentsPer1kTokens: true },
            })
          : [];
        const rateByKey = new Map(models.map((m) => [m.key, (m.inputCentsPer1kTokens + m.outputCentsPer1kTokens) / 2]));
    
        const enriched = keys.map((k) => {
          const remainingCents = Math.max(0, k.quotaCents - k.usedCents);
          const rate = (k.defaultModelKey && rateByKey.get(k.defaultModelKey)) || null;
          const tokensLeft = rate ? estimateTokensLeft({ remainingCents, blendedCentsPer1kTokens: rate }) : null;
          return { ...k, remainingCents, tokensLeft };
        });

    return Response.json({ keys: enriched });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

