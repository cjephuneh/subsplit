import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";
import { createTransactionAndUpdateBalance, postBalanceSideEffects } from "@/server/credits";

export const runtime = "nodejs";

const RedeemPromoSchema = z.object({
  code: z.string().min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson(req, RedeemPromoSchema);

    const code = body.code.toUpperCase().trim();

    // Find the promo code
    const promo = await prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promo) {
      return jsonError(404, {
        error: "INVALID_CODE",
        message: "Invalid promo code. Please check and try again.",
      });
    }

    // Check if promo is active
    if (!promo.isActive) {
      return jsonError(400, {
        error: "INACTIVE",
        message: "This promo code is no longer available.",
      });
    }

    // Check if promo has expired
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return jsonError(400, {
        error: "EXPIRED",
        message: "This promo code has expired.",
      });
    }

    // Check if max uses reached
    if (promo.usedCount >= promo.maxUses) {
      return jsonError(400, {
        error: "MAX_USES_REACHED",
        message: "This promo code has reached its redemption limit.",
      });
    }

    // Check if user already redeemed this code
    const existingRedemption = await prisma.promoRedemption.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId: promo.id,
          userId: user.id,
        },
      },
    });

    if (existingRedemption) {
      return jsonError(400, {
        error: "ALREADY_REDEEMED",
        message: "You've already redeemed this promo code.",
      });
    }

    // All checks passed - redeem the promo in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Increment usage count
      await tx.promoCode.update({
        where: { id: promo.id },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });

      // Create redemption record
      await tx.promoRedemption.create({
        data: {
          promoCodeId: promo.id,
          userId: user.id,
          creditsCents: promo.creditsCents,
        },
      });

      return { creditsCents: promo.creditsCents };
    });

    // Credit the user's wallet
    const walletResult = await createTransactionAndUpdateBalance({
      userId: user.id,
      type: "TOP_UP",
      amountCents: result.creditsCents,
      note: `Promo code: ${code}`,
    });

    await postBalanceSideEffects(user.id);

    return Response.json({
      ok: true,
      creditsCents: result.creditsCents,
      newBalanceCents: walletResult.wallet.balanceCents,
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
      message: "Something went wrong while redeeming the promo code.",
    });
  }
}
