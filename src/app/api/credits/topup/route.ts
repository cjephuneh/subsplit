import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { createTransactionAndUpdateBalance, creditsToCents, postBalanceSideEffects } from "@/server/credits";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const BodySchema = z.object({
  credits: z.number().positive().max(1_000_000),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson(req, BodySchema);

    const amountCents = creditsToCents(body.credits);

    const result = await createTransactionAndUpdateBalance({
      userId: user.id,
      type: "TOP_UP",
      amountCents,
      note: body.note,
    });

    await postBalanceSideEffects(user.id);

    return Response.json({
      ok: true,
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
    return jsonError(500, {
      error: "SERVER_ERROR",
      message: "Something went wrong.",
    });
  }
}

