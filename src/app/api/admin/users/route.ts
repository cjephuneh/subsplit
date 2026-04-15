import { z } from "zod";

import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";

export const runtime = "nodejs";

const QuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    await requireAdminUser();

    const url = new URL(req.url);
    const query = QuerySchema.parse({
      search: url.searchParams.get("search") || undefined,
      page: url.searchParams.get("page") || 1,
      limit: url.searchParams.get("limit") || 20,
    });

    const where = query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: "insensitive" as const } },
            { displayName: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
          isAdmin: true,
          wallet: {
            select: {
              balanceCents: true,
            },
          },
          _count: {
            select: {
              apiKeys: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate spending and credits for each user
    const usersWithMetrics = await Promise.all(
      users.map(async (user) => {
        const [spendingResult, creditsResult] = await Promise.all([
          prisma.creditTransaction.aggregate({
            where: {
              wallet: { userId: user.id },
              type: "SPEND",
            },
            _sum: { amountCents: true },
          }),
          prisma.creditTransaction.aggregate({
            where: {
              wallet: { userId: user.id },
              type: { in: ["TOP_UP", "LOAN_IN"] },
            },
            _sum: { amountCents: true },
          }),
        ]);

        return {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt,
          isAdmin: user.isAdmin,
          wallet: user.wallet,
          apiKeyCount: user._count.apiKeys,
          totalSpentCents: Math.abs(spendingResult._sum.amountCents || 0),
          totalCreditsCents: creditsResult._sum.amountCents || 0,
        };
      })
    );

    return Response.json({
      users: usersWithMetrics,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, {
        error: "BAD_INPUT",
        message: "Invalid query parameters.",
        context: { issues: err.issues },
      });
    }
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
