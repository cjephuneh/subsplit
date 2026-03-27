import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const BodySchema = z.object({
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(5000),
  requestId: z.string().min(3).max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson(req, BodySchema);

    const recentLogs = await prisma.apiKeyUsageLog.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        method: true,
        path: true,
        modelKey: true,
        status: true,
        createdAt: true,
      },
    });

    const created = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: body.subject,
        message: body.message,
        requestId: body.requestId?.trim() ? body.requestId.trim() : undefined,
        contextJson: JSON.stringify({ recentUsageLogs: recentLogs }),
      },
      select: { id: true },
    });

    return Response.json({ ok: true, ticketId: created.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, { error: "BAD_INPUT", message: "Invalid request body.", context: { issues: err.issues } });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

