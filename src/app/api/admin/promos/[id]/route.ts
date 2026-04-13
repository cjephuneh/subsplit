import { z } from "zod";

import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const UpdatePromoSchema = z.object({
  isActive: z.boolean().optional(),
  maxUses: z.number().int().positive().max(100_000).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  note: z.string().max(500).optional(),
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    const { id } = await params;

    const promo = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promo) {
      return jsonError(404, {
        error: "NOT_FOUND",
        message: "Promo code not found.",
      });
    }

    await prisma.promoCode.delete({
      where: { id },
    });

    return Response.json({ ok: true });
  } catch (err) {
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = await parseJson(req, UpdatePromoSchema);

    const promo = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promo) {
      return jsonError(404, {
        error: "NOT_FOUND",
        message: "Promo code not found.",
      });
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.maxUses !== undefined && { maxUses: body.maxUses }),
        ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }),
        ...(body.note !== undefined && { note: body.note }),
      },
      select: {
        id: true,
        code: true,
        creditsCents: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        isActive: true,
        note: true,
        updatedAt: true,
      },
    });

    return Response.json({
      ok: true,
      promo: updated,
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
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return jsonError(403, { error: "FORBIDDEN", message: "Admin access required." });
    }
    return jsonError(500, {
      error: "SERVER_ERROR",
      message: "Something went wrong.",
    });
  }
}
