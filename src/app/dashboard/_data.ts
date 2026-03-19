import { prisma } from "@/server/db";

export async function getDashboardData(userId: string) {
  const wallet = await prisma.creditWallet.findUnique({
    where: { userId },
    select: { id: true, balanceCents: true, lowBalanceCentsThreshold: true },
  });

  const walletId = wallet?.id ?? null;

  const [models, transactions, notifications] = await Promise.all([
    prisma.modelOffering.findMany({
      orderBy: { creditsPer1kTokensCents: "asc" },
      select: {
        key: true,
        name: true,
        provider: true,
        description: true,
        modelType: true,
        creditsPer1kTokensCents: true,
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
  ]);

  return {
    wallet: wallet ?? { id: "missing", balanceCents: 0, lowBalanceCentsThreshold: 10000 },
    models,
    transactions,
    notifications,
  };
}

