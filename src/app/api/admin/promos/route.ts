import { z } from "zod";

import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const CreatePromoSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric (hyphens and underscores allowed)"),
  credits: z.number().positive().max(1_000_000),
  maxUses: z.number().int().positive().max(100_000),
  expiresAt: z.string().optional(),
  note: z.string().max(500).optional(),
});

export async function GET() {
  try {
    await requireAdminUser();

    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        creditsCents: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        isActive: true,
        note: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ promos });
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

export async function POST(req: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await parseJson(req, CreatePromoSchema);

    const creditsCents = Math.round(body.credits * 100);

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: body.code.toUpperCase() },
    });

    if (existing) {
      return jsonError(409, {
        error: "DUPLICATE_CODE",
        message: "This promo code already exists.",
      });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: body.code.toUpperCase(),
        creditsCents,
        maxUses: body.maxUses,
        expiresAt: body.expiresAt ? new Date(body.expiresAt + ":00") : null,
        isActive: true,
        createdByUserId: admin.id,
        note: body.note || null,
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
        createdAt: true,
      },
    });

    return Response.json({
      ok: true,
      promo,
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
