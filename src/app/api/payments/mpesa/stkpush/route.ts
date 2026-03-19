import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";
import { initiateStkPush, PhoneNumberSchema } from "@/server/mpesa";

export const runtime = "nodejs";

const BodySchema = z.object({
  phoneNumber: PhoneNumberSchema,
  intent: z.enum(["TOPUP", "SPEND"]),
  credits: z.number().positive().max(1_000_000).optional(),
  modelKey: z.string().min(1).max(80).optional(),
  tokens: z.number().int().positive().max(10_000_000).optional(),
});

function creditsToCents(credits: number) {
  return Math.round(credits * 100);
}

function costForTokensCents(input: { tokens: number; centsPer1k: number }) {
  return Math.ceil((input.tokens / 1000) * input.centsPer1k);
}

function getKesMultiplier() {
  const raw = process.env.CREDIT_KES_MULTIPLIER ?? "0.95";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0.95;
  return parsed;
}

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson(req, BodySchema);

    const kesMultiplier = getKesMultiplier();

    let creditsCents: number;
    let amountKes: number;
    let metadata: Record<string, unknown>;

    if (body.intent === "TOPUP") {
      const credits = body.credits;
      if (!credits) {
        return jsonError(400, {
          error: "BAD_INPUT",
          message: "credits is required for TOPUP.",
        });
      }
      creditsCents = creditsToCents(credits);
      amountKes = Math.max(1, Math.ceil(credits * kesMultiplier));
      metadata = { intent: "TOPUP", pricing: `${kesMultiplier} KES per credit` };
    } else {
      const modelKey = body.modelKey;
      const tokens = body.tokens;
      if (!modelKey || !tokens) {
        return jsonError(400, {
          error: "BAD_INPUT",
          message: "modelKey and tokens are required for SPEND.",
        });
      }

      const model = await prisma.modelOffering.findUnique({
        where: { key: modelKey },
        select: { key: true, creditsPer1kTokensCents: true },
      });
      if (!model) {
        return jsonError(404, { error: "MODEL_NOT_FOUND", message: "That model is not available." });
      }

      creditsCents = costForTokensCents({
        tokens,
        centsPer1k: model.creditsPer1kTokensCents,
      });
      const credits = creditsCents / 100;
      amountKes = Math.max(1, Math.ceil(credits * kesMultiplier));
      metadata = {
        intent: "SPEND",
        modelKey: model.key,
        tokens,
        pricing: `${kesMultiplier} KES per credit`,
      };
    }

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        provider: "MPESA_DARAJA",
        status: "PENDING",
        environment: "PRODUCTION",
        amountCents: amountKes * 100,
        currency: "KES",
        phoneNumber: body.phoneNumber,
        creditsCents,
        metadataJson: JSON.stringify(metadata),
      },
      select: { id: true },
    });

    const stk = await initiateStkPush({
      phoneNumber: body.phoneNumber,
      amountKes,
      accountReference: `Subsplit-${payment.id.slice(-6)}`,
      transactionDesc: `Subsplit credits top up`,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: stk.CheckoutRequestID,
        merchantRequestId: stk.MerchantRequestID,
      },
    });

    return Response.json({
      ok: true,
      paymentId: payment.id,
      checkoutRequestId: stk.CheckoutRequestID,
      customerMessage: stk.CustomerMessage,
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
    if (err instanceof Error) {
      if (err.message.includes("Missing Daraja credentials")) {
        return jsonError(500, {
          error: "MISCONFIGURED",
          message:
            "Payments are not configured. Set DARAJA_CONSUMER_KEY/SECRET, DARAJA_SHORTCODE, and DARAJA_PASSKEY.",
        });
      }
      if (err.message.includes("Missing APP_BASE_URL")) {
        return jsonError(500, {
          error: "MISCONFIGURED",
          message:
            "Missing APP_BASE_URL. Set APP_BASE_URL to your public domain (or http://localhost:3000 for local dev).",
        });
      }
      if (err.message.startsWith("Daraja auth failed")) {
        return jsonError(502, {
          error: "DARAJA_AUTH_FAILED",
          message:
            "Daraja auth failed. Check DARAJA_CONSUMER_KEY and DARAJA_CONSUMER_SECRET.",
          context: { details: err.message },
        });
      }
      if (err.message.startsWith("STK push failed")) {
        return jsonError(502, {
          error: "STK_PUSH_FAILED",
          message:
            "STK push failed. Confirm your shortcode/passkey AND that your callback URL is publicly reachable (set DARAJA_CALLBACK_URL or APP_BASE_URL to a public domain).",
          context: { details: err.message },
        });
      }
    }

    return jsonError(500, {
      error: "SERVER_ERROR",
      message: "Something went wrong.",
    });
  }
}

