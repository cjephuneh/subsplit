import { z } from "zod";

import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { StkCallbackSchema, extractCallbackValue } from "@/server/mpesa";
import { createTransactionAndUpdateBalance, postBalanceSideEffects } from "@/server/credits";
import { createApiKey } from "@/server/api-keys";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json().catch(() => undefined);
    const cb = StkCallbackSchema.parse(raw);

    const stk = cb.Body.stkCallback;
    const checkoutId = stk.CheckoutRequestID;

    const payment = await prisma.payment.findFirst({
      where: { provider: "MPESA_DARAJA", providerRef: checkoutId },
      select: {
        id: true,
        status: true,
        userId: true,
        creditsCents: true,
        environment: true,
        metadataJson: true,
      },
    });

    if (!payment) {
      // Always return 200 to avoid repeated callbacks.
      return Response.json({ ok: true });
    }

    if (payment.status === "COMPLETED" || payment.status === "FAILED") {
      return Response.json({ ok: true });
    }

    if (stk.ResultCode !== 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadataJson: JSON.stringify({
            resultCode: stk.ResultCode,
            resultDesc: stk.ResultDesc,
          }),
        },
      });
      return Response.json({ ok: true });
    }

    const receipt = extractCallbackValue(cb, "MpesaReceiptNumber");
    const amount = extractCallbackValue(cb, "Amount");
    const phone = extractCallbackValue(cb, "PhoneNumber");
    const transactionDate = extractCallbackValue(cb, "TransactionDate");

    const existingMeta = safeJson(payment.metadataJson);
    const mergedMeta = {
      ...existingMeta,
      receipt,
      amount,
      phone,
      transactionDate,
    };

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          mpesaReceipt: typeof receipt === "string" ? receipt : undefined,
          metadataJson: JSON.stringify(mergedMeta),
        },
      });
    });

    // Credit wallet top-up tied to the payment.
    await createTransactionAndUpdateBalance({
      userId: payment.userId,
      type: "TOP_UP",
      amountCents: payment.creditsCents,
      note: `M-Pesa top-up${typeof receipt === "string" ? ` (${receipt})` : ""}`,
    });
    await postBalanceSideEffects(payment.userId);

    // If this payment was initiated from a SPEND intent, immediately spend those credits.
    const intent = typeof existingMeta.intent === "string" ? existingMeta.intent : null;
    if (intent === "SPEND") {
      const modelKey = typeof existingMeta.modelKey === "string" ? existingMeta.modelKey : null;
      const tokens = typeof existingMeta.tokens === "number" ? existingMeta.tokens : null;
      if (modelKey && tokens && Number.isFinite(tokens)) {
        await createTransactionAndUpdateBalance({
          userId: payment.userId,
          type: "SPEND",
          amountCents: -payment.creditsCents,
          modelKey,
          note: `Paid usage: ${tokens} tokens`,
        });
        await postBalanceSideEffects(payment.userId);
      }
    }

    // Issue an API key (one-time). If user already has one in that env, skip.
    const existingKey = await prisma.apiKey.findFirst({
      where: { userId: payment.userId, environment: payment.environment, revokedAt: null },
      select: { id: true },
    });
    if (!existingKey) {
      await createApiKey({
        userId: payment.userId,
        environment: payment.environment,
        label: "Production key",
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, {
        error: "BAD_INPUT",
        message: "Invalid callback payload.",
        context: { issues: err.issues },
      });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

function safeJson(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}

