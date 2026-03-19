import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/server/db";

const SESSION_COOKIE = "subsplit_session";

const authSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
};

const SessionPayloadSchema = z.object({
  sub: z.string(),
});
type SessionPayload = z.infer<typeof SessionPayloadSchema>;

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(authSecret());
}

export async function createSessionCookie(userId: string) {
  const token = await createSessionToken(userId);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, authSecret());
    const parsed = SessionPayloadSchema.safeParse(payload);
    if (!parsed.success) return null;

    const user = await prisma.user.findUnique({
      where: { id: parsed.data.sub },
      select: { id: true, email: true, displayName: true, isAdmin: true },
    });
    return user ?? null;
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdminUser(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (!user.isAdmin) throw new Error("FORBIDDEN");
  return user;
}

