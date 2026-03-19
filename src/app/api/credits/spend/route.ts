import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import {
  createTransactionAndUpdateBalance,
  postBalanceSideEffects,
} from "@/server/credits";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const BodySchema = z.object({
  modelKey: z.string().min(1).max(50),
  tokens: z.number().int().positive().max(10_000_000),
  note: z.string().max(200).optional(),
});

function costForTokensCents(input: { tokens: number; blendedCentsPer1k: number }) {
  // ceil so we don't undercharge at small sizes
  return Math.ceil((input.tokens / 1000) * input.blendedCentsPer1k);
}

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson(req, BodySchema);

    const model = await prisma.modelOffering.findUnique({
      where: { key: body.modelKey },
      select: { key: true, inputCentsPer1kTokens: true, outputCentsPer1kTokens: true },
    });
    if (!model) {
      return jsonError(404, {
        error: "MODEL_NOT_FOUND",
        message: "That model is not available.",
      });
    }

    const blendedCentsPer1k = (model.inputCentsPer1kTokens + model.outputCentsPer1kTokens) / 2;
    const costCents = costForTokensCents({
      tokens: body.tokens,
      blendedCentsPer1k,
    });

    const result = await createTransactionAndUpdateBalance({
      userId: user.id,
      type: "SPEND",
      amountCents: -costCents,
      modelKey: model.key,
      note: body.note ?? `Usage: ${body.tokens} tokens`,
    });

    await postBalanceSideEffects(user.id);

    return Response.json({
      ok: true,
      costCents,
      balanceCents: result.wallet.balanceCents,
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
      return jsonError(409, {
        error: "INSUFFICIENT_FUNDS",
        message: "Not enough credits to run this request.",
      });
    }

    return jsonError(500, {
      error: "SERVER_ERROR",
      message: "Something went wrong.",
    });
  }
}

