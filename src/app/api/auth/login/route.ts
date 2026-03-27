import { z } from "zod";
import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { createSessionToken, verifyPassword } from "@/server/auth";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    const body = await parseJson(req, BodySchema);

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { id: true, passwordHash: true, isAdmin: true },
    });
    if (!user) {
      return jsonError(401, {
        error: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect.",
      });
    }

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) {
      return jsonError(401, {
        error: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect.",
      });
    }

    const token = await createSessionToken(user.id);
    const res = NextResponse.json({ ok: true, isAdmin: user.isAdmin });
    res.cookies.set("subsplit_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  } catch (err) {
    console.error("LOGIN_ERROR", err);
    if (err instanceof z.ZodError) {
      return jsonError(400, {
        error: "BAD_INPUT",
        message: "Invalid request body.",
        context: { issues: err.issues },
      });
    }
    if (err instanceof Error && err.message.includes("Missing AUTH_SECRET")) {
      return jsonError(500, {
        error: "MISSING_AUTH_SECRET",
        message: "Server is missing AUTH_SECRET configuration.",
      });
    }
    if (
      err instanceof Error &&
      (err.message.includes("ERR_DLOPEN_FAILED") ||
        err.message.includes("better_sqlite3") ||
        err.message.includes("Module did not self-register"))
    ) {
      return jsonError(500, {
        error: "NATIVE_MODULE_ERROR",
        message: "Native database module failed to load on this host.",
      });
    }
    return jsonError(500, {
      error: "SERVER_ERROR",
      message: "Something went wrong.",
    });
  }
}

