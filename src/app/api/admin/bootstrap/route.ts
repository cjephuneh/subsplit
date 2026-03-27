import { z } from "zod";

import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const BodySchema = z.object({
  secret: z.string().min(8).max(200),
  email: z.string().email().max(255).default("calebjephuneh@gmail.com"),
  password: z.string().min(8).max(200),
  displayName: z.string().min(2).max(60).default("Caleb"),
});

function requiredSecret() {
  const s = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!s) throw new Error("Missing ADMIN_BOOTSTRAP_SECRET");
  return s;
}

export async function POST(req: Request) {
  try {
    const body = await parseJson(req, BodySchema);

    if (body.secret !== requiredSecret()) {
      return jsonError(403, { error: "FORBIDDEN", message: "Invalid bootstrap secret." });
    }

    const already = await prisma.appConfig.findUnique({
      where: { key: "admin_bootstrap_done" },
      select: { value: true },
    });
    if (already?.value === "true") {
      return jsonError(409, { error: "ALREADY_BOOTSTRAPPED", message: "Admin bootstrap already completed." });
    }

    const email = body.email.toLowerCase();
    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        displayName: body.displayName,
        passwordHash,
        isAdmin: true,
        wallet: { create: {} },
      },
      update: {
        displayName: body.displayName,
        passwordHash,
        isAdmin: true,
      },
      select: { id: true, email: true, isAdmin: true },
    });

    await prisma.appConfig.upsert({
      where: { key: "admin_bootstrap_done" },
      create: { key: "admin_bootstrap_done", value: "true" },
      update: { value: "true" },
    });

    return Response.json({ ok: true, adminUserId: user.id, email: user.email });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, { error: "BAD_INPUT", message: "Invalid request body.", context: { issues: err.issues } });
    }
    if (err instanceof Error && err.message.includes("Missing ADMIN_BOOTSTRAP_SECRET")) {
      return jsonError(500, { error: "MISCONFIGURED", message: "Missing ADMIN_BOOTSTRAP_SECRET." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

