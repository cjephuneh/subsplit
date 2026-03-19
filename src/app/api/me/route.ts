import { prisma } from "@/server/db";
import { getSessionUser } from "@/server/auth";
import { jsonError } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
  }

  const wallet = await prisma.creditWallet.findUnique({
    where: { userId: user.id },
    select: {
      balanceCents: true,
      lowBalanceCentsThreshold: true,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return Response.json(
    {
    user,
    wallet: wallet ?? { balanceCents: 0, lowBalanceCentsThreshold: 10000 },
    unreadNotifications: unreadCount,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

