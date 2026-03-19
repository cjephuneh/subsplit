import { z } from "zod";
import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { createSessionToken, hashPassword } from "@/server/auth";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";
import { createTransactionAndUpdateBalance } from "@/server/credits";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
  displayName: z.string().min(2).max(60),
});

export async function POST(req: Request) {
  try {
    const body = await parseJson(req, BodySchema);

    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      return jsonError(409, {
        error: "EMAIL_TAKEN",
        message: "That email is already registered.",
      });
    }

    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        displayName: body.displayName,
        passwordHash: await hashPassword(body.password),
        wallet: { create: {} },
      },
      select: { id: true },
    });

    // Free starter credits (20.00 credits) per new user.
    await createTransactionAndUpdateBalance({
      userId: user.id,
      type: "TOP_UP",
      amountCents: 2000,
      note: "Welcome bonus",
    });

    const token = await createSessionToken(user.id);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("subsplit_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, {
        error: "BAD_INPUT",
        message: "Invalid request body.",
        context: { issues: err.issues },
      });
    }
    return jsonError(500, {
      error: "SERVER_ERROR",
      message: "Something went wrong.",
    });
  }
}

