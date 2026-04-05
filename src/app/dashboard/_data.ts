import { prisma } from "@/server/db";
import { listEnrichedApiKeysForUser } from "@/server/api-keys-list";

export async function getDashboardData(userId: string) {
  const wallet = await prisma.creditWallet.findUnique({
    where: { userId },
    select: { id: true, balanceCents: true, lowBalanceCentsThreshold: true },
  });

  const walletId = wallet?.id ?? null;

  const [models, transactions, notifications, apiKeys] = await Promise.all([
    prisma.modelOffering.findMany({
      orderBy: { outputCentsPer1kTokens: "asc" },
      select: {
        key: true,
        name: true,
        provider: true,
        description: true,
        modelType: true,
        inputCentsPer1kTokens: true,
        outputCentsPer1kTokens: true,
      },
    }),
    walletId
      ? prisma.creditTransaction.findMany({
          where: { walletId },
          orderBy: { createdAt: "desc" },
          take: 25,
          select: {
            id: true,
            type: true,
            amountCents: true,
            modelKey: true,
            note: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        readAt: true,
        createdAt: true,
      },
    }),
    listEnrichedApiKeysForUser(userId),
  ]);

  return {
    wallet: wallet ?? { id: "missing", balanceCents: 0, lowBalanceCentsThreshold: 10000 },
    models,
    transactions,
    notifications,
    apiKeys,
  };
}


