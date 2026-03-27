import { z } from "zod";

import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";

export const runtime = "nodejs";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]).optional(),
});

export async function GET(req: Request) {
  try {
    await requireAdminUser();
    const url = new URL(req.url);
    const parsed = QuerySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });

    const tickets = await prisma.supportTicket.findMany({
      where: parsed.status ? { status: parsed.status } : undefined,
      take: parsed.limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
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
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return jsonError(403, { error: "FORBIDDEN", message: "Admins only." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

