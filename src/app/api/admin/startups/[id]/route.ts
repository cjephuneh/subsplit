import { z } from "zod";

import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const ReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNotes: z.string().max(1000).optional(),
});

export async function GET(req: Request) {
  try {
    await requireAdminUser();

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "PENDING";

    const applications = await prisma.startupApplication.findMany({
      where: {
        status: status as any,
      },
      orderBy: { appliedAt: "desc" },
      select: {
        id: true,
        startupName: true,
        problem: true,
        country: true,
        phoneNumber: true,
        email: true,
        startupStage: true,
        startupLink: true,
        founderVideoUrl: true,
        status: true,
        adminNotes: true,
        creditsAllocated: true,
        expiresAt: true,
        appliedAt: true,
        reviewedAt: true,
      },
    });

    return Response.json({ applications });
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    const { id } = await params;
    const body = await parseJson(req, ReviewSchema);

    const application = await prisma.startupApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return jsonError(404, {
        error: "NOT_FOUND",
        message: "Application not found.",
      });
    }

    if (application.status !== "PENDING") {
      return jsonError(400, {
        error: "ALREADY_REVIEWED",
        message: "This application has already been reviewed.",
      });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const updated = await prisma.startupApplication.update({
      where: { id },
      data: {
        status: body.status,
        adminNotes: body.adminNotes || null,
        reviewedAt: now,
        reviewedByUserId: admin.id,
        expiresAt: body.status === "APPROVED" ? expiresAt : undefined,
      },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        email: true,
      },
    });

    // If approved and user already exists, credit their wallet
    if (body.status === "APPROVED") {
      const existingUser = await prisma.user.findUnique({
        where: { email: application.email },
        include: { wallet: true },
      });

      if (existingUser) {
        // Create or update wallet with startup credits
        await prisma.$transaction(async (tx) => {
          let wallet = existingUser.wallet;
          
          if (!wallet) {
            wallet = await tx.creditWallet.create({
              data: {
                userId: existingUser.id,
                balanceCents: application.creditsAllocated,
              },
            });
          } else {
            await tx.creditWallet.update({
              where: { id: wallet.id },
              data: { balanceCents: { increment: application.creditsAllocated } },
            });
          }

          await tx.creditTransaction.create({
            data: {
              walletId: wallet.id,
              type: "TOP_UP",
              amountCents: application.creditsAllocated,
              note: `Subsplit for Startups - 5000 credits (expires ${expiresAt.toLocaleDateString()})`,
              expiresAt,
              isStartupCredit: true,
            },
          });
        });
      }
    }

    return Response.json({
      ok: true,
      application: updated,
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
