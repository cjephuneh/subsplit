import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireSessionUser();

    const keys = await prisma.listedApiKey.findMany({
      where: { userId: user.id },
      select: { balanceCents: true, isActive: true },
    });

    const totalEarnedCents = keys.reduce((acc, k) => acc + k.balanceCents, 0);
    const activeKeysCount = keys.filter((k) => k.isActive).length;
    const totalKeysCount = keys.length;

    return Response.json({
      stats: {
        totalEarnedCents,
        activeKeysCount,
        totalKeysCount,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}
