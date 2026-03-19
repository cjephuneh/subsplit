import { z } from "zod";

import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const UpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  provider: z.string().min(2).max(80).optional(),
  description: z.string().min(0).max(280).optional(),
  modelType: z.enum(["TEXT", "VOICE", "IMAGE", "VIDEO", "EMBEDDING"]).optional(),
  inputCentsPer1kTokens: z.number().int().min(1).max(100_000).optional(),
  outputCentsPer1kTokens: z.number().int().min(1).max(100_000).optional(),
  supportsChat: z.boolean().optional(),
  supportsImage: z.boolean().optional(),
  supportsVideo: z.boolean().optional(),
});

export async function PUT(req: Request, ctx: { params: Promise<{ key: string }> }) {
  try {
    await requireAdminUser();
    const { key } = await ctx.params;
    const body = await parseJson(req, UpdateSchema);

    const updated = await prisma.modelOffering.update({
      where: { key },
      data: {
        name: body.name,
        provider: body.provider,
        description: body.description,
        modelType: body.modelType,
        inputCentsPer1kTokens: body.inputCentsPer1kTokens,
        outputCentsPer1kTokens: body.outputCentsPer1kTokens,
        supportsChat: body.supportsChat,
        supportsImage: body.supportsImage,
        supportsVideo: body.supportsVideo,
      },
      select: { key: true },
    });

    return Response.json({ ok: true, modelKey: updated.key });
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

export async function DELETE(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  try {
    await requireAdminUser();
    const { key } = await ctx.params;
    await prisma.modelOffering.delete({ where: { key } });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return jsonError(403, { error: "FORBIDDEN", message: "Admins only." });
    }
    // Deleting a missing model should be idempotent
    return Response.json({ ok: true });
  }
}

