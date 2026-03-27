import { z } from "zod";

import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const UpdateSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]),
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await ctx.params;
    const body = await parseJson(req, UpdateSchema);

    await prisma.supportTicket.update({
      where: { id },
      data: { status: body.status },
      select: { id: true },
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, { error: "BAD_INPUT", message: "Invalid request body.", context: { issues: err.issues } });
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

