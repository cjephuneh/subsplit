import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const keys = await prisma.listedApiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    
    const maskedKeys = keys.map((k) => ({
      id: k.id,
      provider: k.provider,
      label: k.label,
      isActive: k.isActive,
      balanceCents: k.balanceCents,
      customMarkupPercent: k.customMarkupPercent,
      createdAt: k.createdAt,
      apiKeyMasked: k.apiKey.length > 8 ? `${k.apiKey.slice(0, 4)}...${k.apiKey.slice(-4)}` : "...",
    }));
    return Response.json({ keys: maskedKeys });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

const CreateBodySchema = z.object({
  provider: z.enum(["openai", "anthropic", "groq", "grok"]),
  label: z.string().min(2).max(40),
  apiKey: z.string().min(5).max(200),
  customMarkupPercent: z.number().int().min(0).max(500).optional().default(0),
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson(req, CreateBodySchema);

    const created = await prisma.listedApiKey.create({
      data: {
        userId: user.id,
        provider: body.provider,
        label: body.label,
        apiKey: body.apiKey,
        isActive: true,
        customMarkupPercent: body.customMarkupPercent,
      },
    });

    return Response.json({
      ok: true,
      key: {
        id: created.id,
        provider: created.provider,
        label: created.label,
        isActive: created.isActive,
        balanceCents: created.balanceCents,
        customMarkupPercent: created.customMarkupPercent,
        createdAt: created.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, {
        error: "BAD_INPUT",
        message: "Invalid request body.",
        context: { issues: err.issues },
      });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

const UpdateBodySchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  customMarkupPercent: z.number().int().min(0).max(500).optional(),
});

export async function PUT(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson(req, UpdateBodySchema);

    const existing = await prisma.listedApiKey.findUnique({
      where: { id: body.id },
    });

    if (!existing || existing.userId !== user.id) {
      return jsonError(404, { error: "KEY_NOT_FOUND", message: "Key not found." });
    }

    const dataToUpdate: any = {};
    if (body.isActive !== undefined) dataToUpdate.isActive = body.isActive;
    if (body.customMarkupPercent !== undefined) dataToUpdate.customMarkupPercent = body.customMarkupPercent;

    const updated = await prisma.listedApiKey.update({
      where: { id: body.id },
      data: dataToUpdate,
    });

    return Response.json({
      ok: true,
      key: {
        id: updated.id,
        isActive: updated.isActive,
        customMarkupPercent: updated.customMarkupPercent,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, {
        error: "BAD_INPUT",
        message: "Invalid request body.",
        context: { issues: err.issues },
      });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonError(400, { error: "BAD_INPUT", message: "Missing id parameter." });
    }

    const existing = await prisma.listedApiKey.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return jsonError(404, { error: "KEY_NOT_FOUND", message: "Key not found." });
    }

    await prisma.listedApiKey.delete({
      where: { id },
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}
