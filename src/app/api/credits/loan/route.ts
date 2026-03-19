import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { creditsToCents, postBalanceSideEffects } from "@/server/credits";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const BodySchema = z.object({
  toEmail: z.string().email().max(255),
  credits: z.number().positive().max(1_000_000),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const from = await requireSessionUser();
    const body = await parseJson(req, BodySchema);

    const toEmail = body.toEmail.toLowerCase();
    if (toEmail === from.email.toLowerCase()) {
      return jsonError(400, {
        error: "BAD_INPUT",
        message: "You can’t loan credits to yourself.",
      });
    }

    const amountCents = creditsToCents(body.credits);

    const toUser = await prisma.user.findUnique({
      where: { email: toEmail },
      select: { id: true },
    });
    if (!toUser) {
      return jsonError(404, {
        error: "NOT_FOUND",
        message: "Recipient user not found.",
      });
    }

    const { fromWallet, toWallet } = await prisma.$transaction(async (tx) => {
      const fromWallet = await tx.creditWallet.upsert({
        where: { userId: from.id },
        update: {},
        create: { userId: from.id },
        select: { id: true, balanceCents: true },
      });

      const toWallet = await tx.creditWallet.upsert({
        where: { userId: toUser.id },
        update: {},
        create: { userId: toUser.id },
        select: { id: true, balanceCents: true },
      });

      if (fromWallet.balanceCents - amountCents < 0) {
        return Promise.reject(new Error("INSUFFICIENT_FUNDS"));
      }

      const updatedFrom = await tx.creditWallet.update({
        where: { id: fromWallet.id },
        data: { balanceCents: { decrement: amountCents } },
        select: { id: true, balanceCents: true },
      });

      const updatedTo = await tx.creditWallet.update({
        where: { id: toWallet.id },
        data: { balanceCents: { increment: amountCents } },
        select: { id: true, balanceCents: true },
      });

      await tx.creditTransaction.createMany({
        data: [
          {
            walletId: updatedFrom.id,
            type: "LOAN_OUT",
            amountCents: -amountCents,
            note: body.note,
            counterpartyUserId: toUser.id,
          },
          {
            walletId: updatedTo.id,
            type: "LOAN_IN",
            amountCents,
            note: body.note,
            counterpartyUserId: from.id,
          },
        ],
      });

      return { fromWallet: updatedFrom, toWallet: updatedTo };
    });

    await Promise.all([postBalanceSideEffects(from.id), postBalanceSideEffects(toUser.id)]);

    return Response.json({
      ok: true,
      fromBalanceCents: fromWallet.balanceCents,
      toBalanceCents: toWallet.balanceCents,
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
    if (err instanceof Error && err.message === "INSUFFICIENT_FUNDS") {
      return jsonError(409, {
        error: "INSUFFICIENT_FUNDS",
        message: "Not enough credits to complete this loan.",
      });
    }
    return jsonError(500, {
      error: "SERVER_ERROR",
      message: "Something went wrong.",
    });
  }
}

