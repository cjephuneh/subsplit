import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            id: true,
            balanceCents: true,
            lowBalanceCentsThreshold: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return jsonError(404, {
        error: "NOT_FOUND",
        message: "User not found.",
      });
    }

    const walletId = user.wallet?.id;

    // Fetch data sequentially with error handling
    let transactions: any[] = [];
    let apiLogs: any[] = [];
    let apiKeys: any[] = [];
    let payments: any[] = [];

    try {
      // Recent transactions
      if (walletId) {
        transactions = await prisma.creditTransaction.findMany({
          where: { walletId },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            type: true,
            amountCents: true,
            modelKey: true,
            note: true,
            expiresAt: true,
            isStartupCredit: true,
            createdAt: true,
          },
        });
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }

    try {
      // Recent API usage logs
      apiLogs = await prisma.apiKeyUsageLog.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          method: true,
          path: true,
          status: true,
          modelKey: true,
          createdAt: true,
          apiKeyId: true,
        },
      });
    } catch (err) {
      console.error("Error fetching API logs:", err);
    }

    try {
      // API keys
      apiKeys = await prisma.apiKey.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          label: true,
          prefix: true,
          environment: true,
          revokedAt: true,
          lastUsedAt: true,
          createdAt: true,
        },
      });
    } catch (err) {
      console.error("Error fetching API keys:", err);
    }

    try {
      // Payments
      payments = await prisma.payment.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          provider: true,
          status: true,
          amountCents: true,
          currency: true,
          creditsCents: true,
          phoneNumber: true,
          mpesaReceipt: true,
          createdAt: true,
        },
      });
    } catch (err) {
      console.error("Error fetching payments:", err);
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      wallet: user.wallet,
      transactions,
      apiLogs,
      apiKeys,
      payments,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return jsonError(403, { error: "FORBIDDEN", message: "Admin access required." });
    }
    return jsonError(500, {
      error: "SERVER_ERROR",
      message: "Something went wrong.",
    });
  }
}
