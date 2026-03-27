import crypto from "node:crypto";
import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";
import { initializePaystackCheckout } from "@/server/paystack";

export const runtime = "nodejs";

const BodySchema = z.object({
  credits: z.number().positive().max(1_000_000),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson(req, BodySchema);

    const amountKes = Math.max(1, Math.ceil(body.credits));
    const amountCents = amountKes * 100;
    const creditsCents = Math.round(body.credits * 100);
    const reference = `ss_ps_${crypto.randomUUID().replace(/-/g, "")}`;

    await prisma.payment.create({
      data: {
        userId: user.id,
        provider: "PAYSTACK",
        status: "PENDING",
        environment: "PRODUCTION",
        amountCents,
        currency: "KES",
        phoneNumber: "",
        creditsCents,
        providerRef: reference,
        metadataJson: JSON.stringify({ intent: "TOPUP", source: "PAYSTACK_CARD" }),
      },
    });

    const init = await initializePaystackCheckout({
      email: body.email ?? user.email,
      amountKobo: amountCents,
      reference,
      metadata: { userId: user.id, creditsCents },
    });

    return Response.json({ ok: true, authorizationUrl: init.authorizationUrl, reference: init.reference });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, { error: "BAD_INPUT", message: "Invalid request body.", context: { issues: err.issues } });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    if (err instanceof Error && err.message.includes("PAYSTACK_INIT_FAILED")) {
      return jsonError(502, { error: "PAYSTACK_INIT_FAILED", message: "Unable to initialize card checkout." });
    }
    if (err instanceof Error && err.message.includes("Missing PAYSTACK_SECRET_KEY")) {
      return jsonError(500, { error: "MISCONFIGURED", message: "Missing PAYSTACK_SECRET_KEY." });
    }
    if (err instanceof Error && err.message.includes("Missing APP_BASE_URL")) {
      return jsonError(500, { error: "MISCONFIGURED", message: "Missing APP_BASE_URL." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

