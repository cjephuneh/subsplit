import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";

export const runtime = "nodejs";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(req: Request) {
  try {
    const user = await requireSessionUser();
    const url = new URL(req.url);
    const query = QuerySchema.parse({ limit: url.searchParams.get("limit") ?? undefined });

    const logs = await prisma.apiKeyUsageLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 50,
      select: {
        id: true,
        method: true,
        path: true,
        status: true,
        ip: true,
        userAgent: true,
        createdAt: true,
        apiKey: {
          select: { id: true, label: true, prefix: true },
        },
      },
    });

    return Response.json({ logs });
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
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

