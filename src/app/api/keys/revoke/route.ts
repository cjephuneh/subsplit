import { z } from "zod";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const BodySchema = z.object({
  id: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson(req, BodySchema);

    const key = await prisma.apiKey.findUnique({
      where: { id: body.id },
      select: { id: true, userId: true, revokedAt: true },
    });
    if (!key || key.userId !== user.id) {
      return jsonError(404, { error: "NOT_FOUND", message: "Key not found." });
    }
    if (key.revokedAt) {
      return Response.json({ ok: true });
    }

    await prisma.apiKey.update({
      where: { id: body.id },
      data: { revokedAt: new Date() },
    });

    return Response.json({ ok: true });
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

