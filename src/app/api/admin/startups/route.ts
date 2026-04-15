import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";

export const runtime = "nodejs";

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
