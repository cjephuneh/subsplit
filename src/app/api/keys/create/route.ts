import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { createApiKey } from "@/server/api-keys";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";
import { createTransactionAndUpdateBalance, creditsToCents, postBalanceSideEffects } from "@/server/credits";

export const runtime = "nodejs";

const BodySchema = z.object({
  label: z.string().min(2).max(40),
  credits: z.number().min(1).max(1_000_000),
  defaultModelKey: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson(req, BodySchema);

    const modelKey = body.defaultModelKey ?? "gpt-4";
    const model = await prisma.modelOffering.findUnique({
      where: { key: modelKey },
      select: { key: true },
    });
    if (!model) {
      return jsonError(404, { error: "MODEL_NOT_FOUND", message: "That default model is not available." });
    }

    const quotaCents = creditsToCents(body.credits);

    // Allocate wallet credits into the API key quota.
    await createTransactionAndUpdateBalance({
      userId: user.id,
      type: "ADJUSTMENT",
      amountCents: -quotaCents,
      modelKey: model.key,
      note: `API key quota allocation: ${body.credits.toFixed(2)} credits`,
    });
    await postBalanceSideEffects(user.id);

    const created = await createApiKey({
      userId: user.id,
      environment: "PRODUCTION",
      label: body.label,
      quotaCents,
      defaultModelKey: model.key,
    });

    return Response.json({
      ok: true,
      apiKey: created.key, // show once
      prefix: created.prefix,
      environment: created.environment,
      label: created.label,
      quotaCents: created.quotaCents,
      usedCents: created.usedCents,
      defaultModelKey: created.defaultModelKey,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, {
        error: "BAD_INPUT",
        message: "Invalid request body.",
        context: { issues: err.issues },
      });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    if (err instanceof Error && err.message.startsWith("INSUFFICIENT_FUNDS")) {
      return jsonError(409, { error: "INSUFFICIENT_FUNDS", message: "Not enough wallet balance to allocate to this key." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

