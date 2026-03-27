import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";

export const runtime = "nodejs";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    const user = await requireSessionUser();
    const url = new URL(req.url);
    const parsed = QuerySchema.parse({ limit: url.searchParams.get("limit") ?? undefined });

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      take: parsed.limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        subject: true,
        message: true,
        requestId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ tickets });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, { error: "BAD_INPUT", message: "Invalid query.", context: { issues: err.issues } });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

