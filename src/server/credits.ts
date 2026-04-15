import { z } from "zod";

import { prisma } from "@/server/db";

export const CentsSchema = z
  .number()
  .int()
  .refine((n) => Number.isFinite(n), "Must be finite");

export function creditsToCents(credits: number) {
  const cents = Math.round(credits * 100);
  if (!Number.isFinite(cents)) throw new Error("Invalid credits");
  return cents;
}

export function centsToCredits(cents: number) {
  return cents / 100;
}

export type WalletSnapshot = {
  id: string;
  balanceCents: number;
  lowBalanceCentsThreshold: number;
};

async function ensureWallet(userId: string) {
  const existing = await prisma.creditWallet.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.creditWallet.create({
    data: { userId },
  });
}

async function maybeCreateLowBalanceNotification(input: {
  userId: string;
  balanceCents: number;
  thresholdCents: number;
}) {
  const { userId, balanceCents, thresholdCents } = input;
  if (balanceCents >= thresholdCents) return;

  const last = await prisma.notification.findFirst({
    where: { userId, type: "LOW_BALANCE" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (last) {
    const msSince = Date.now() - last.createdAt.getTime();
    if (msSince < 1000 * 60 * 60 * 12) return; // avoid spam
  }

  const credits = centsToCredits(balanceCents);
  const threshold = centsToCredits(thresholdCents);

  await prisma.notification.create({
    data: {
      userId,
      type: "LOW_BALANCE",
      title: "Low credit balance",
      message: `Your balance is ${credits.toFixed(2)} credits (threshold ${threshold.toFixed(2)}). Top up soon to avoid interruptions.`,
    },
  });
}

type CreateTxInput = {
  userId: string;
  type:
    | "TOP_UP"
    | "SPEND"
    | "LOAN_OUT"
    | "LOAN_IN"
    | "REPAY_OUT"
    | "REPAY_IN"
    | "ADJUSTMENT";
  amountCents: number; // signed, in centi-credits
  modelKey?: string;
  note?: string;
  counterpartyUserId?: string;
  expiresAt?: Date;
  isStartupCredit?: boolean;
};

export async function createTransactionAndUpdateBalance(input: CreateTxInput) {
  const { userId, type, amountCents, modelKey, note, counterpartyUserId, expiresAt, isStartupCredit } =
    input;

  if (!Number.isInteger(amountCents) || amountCents === 0) {
    throw new Error("Invalid transaction amount");
  }

  const wallet = await ensureWallet(userId);

  return prisma.$transaction(async (tx) => {
    const latestWallet = await tx.creditWallet.findUnique({
      where: { id: wallet.id },
      select: {
        id: true,
        userId: true,
        balanceCents: true,
        lowBalanceCentsThreshold: true,
      },
    });
    if (!latestWallet) throw new Error("Wallet not found");

    const nextBalance = latestWallet.balanceCents + amountCents;
    if (nextBalance < 0) {
      const balanceCredits = centsToCredits(latestWallet.balanceCents);
      throw new Error(
        `INSUFFICIENT_FUNDS:${balanceCredits.toFixed(2)}:${centsToCredits(-amountCents).toFixed(2)}`,
      );
    }

    const updatedWallet = await tx.creditWallet.update({
      where: { id: latestWallet.id },
      data: { balanceCents: nextBalance },
      select: {
        id: true,
        balanceCents: true,
        lowBalanceCentsThreshold: true,
      },
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        walletId: updatedWallet.id,
        type,
        amountCents,
        modelKey,
        note,
        counterpartyUserId,
        expiresAt: expiresAt || null,
        isStartupCredit: isStartupCredit || false,
      },
    });

    return {
      wallet: updatedWallet satisfies WalletSnapshot,
      transaction,
    };
  });
}

export async function getWalletSnapshot(userId: string): Promise<WalletSnapshot> {
  const wallet = await ensureWallet(userId);
  return {
      id: wallet.id,
    balanceCents: wallet.balanceCents,
    lowBalanceCentsThreshold: wallet.lowBalanceCentsThreshold,
  };
}

export async function postBalanceSideEffects(userId: string) {
  const wallet = await ensureWallet(userId);
  await maybeCreateLowBalanceNotification({
    userId,
    balanceCents: wallet.balanceCents,
    thresholdCents: wallet.lowBalanceCentsThreshold,
  });
}

