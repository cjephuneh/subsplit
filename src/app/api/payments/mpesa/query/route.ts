import { z } from "zod";
import crypto from "node:crypto";

import { requireSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { queryStkPush } from "@/server/mpesa";
import { createTransactionAndUpdateBalance, postBalanceSideEffects } from "@/server/credits";
import { createApiKey } from "@/server/api-keys";

export const runtime = "nodejs";

const BodySchema = z.object({
  checkoutRequestId: z.string().min(5).max(200),
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const raw: unknown = await req.json().catch(() => undefined);
    const body = BodySchema.parse(raw);

    const payment = await prisma.payment.findFirst({
      where: { provider: "MPESA_DARAJA", providerRef: body.checkoutRequestId },
      select: { id: true, status: true, userId: true, creditsCents: true, environment: true, metadataJson: true },
    });
    if (!payment) {
      return jsonError(404, { error: "NOT_FOUND", message: "Payment not found." });
    }
    if (payment.userId !== user.id) {
      return jsonError(403, { error: "FORBIDDEN", message: "That payment does not belong to you." });
    }

    if (payment.status === "COMPLETED") {
      const meta = safeJson(payment.metadataJson);
      const apiKey = getOneTimeApiKeyFromMeta(meta);
      return Response.json({ ok: true, status: "COMPLETED", apiKey });
    }

    const result = await queryStkPush({ checkoutRequestId: body.checkoutRequestId });

    // Daraja ResultCode notes:
    // - "0": success
    // - "4999": still processing
    // - others: failed/cancelled/timeout
    const status = interpretResultCode(result.ResultCode);

    if (status === "PENDING") {
      // Make sure we don't permanently mark processing payments as failed.
      if (payment.status !== "PENDING") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "PENDING", metadataJson: JSON.stringify({ ...safeJson(payment.metadataJson), stkQuery: result }) },
        });
      } else {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { metadataJson: JSON.stringify({ ...safeJson(payment.metadataJson), stkQuery: result }) },
        });
      }
      return Response.json({ ok: true, status: "PENDING", result });
    }

    if (status === "FAILED") {
      await prisma.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "FAILED", metadataJson: JSON.stringify({ ...safeJson(payment.metadataJson), stkQuery: result }) },
      });
      return Response.json({ ok: true, status: "FAILED", result });
    }

    const completedMeta: Record<string, unknown> = {
      ...safeJson(payment.metadataJson),
      stkQuery: result,
    };
    const claimed = await prisma.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: {
        status: "COMPLETED",
        metadataJson: JSON.stringify(completedMeta),
      },
    });

    if (claimed.count === 0) {
      const fresh = await prisma.payment.findUnique({
        where: { id: payment.id },
        select: { status: true, metadataJson: true },
      });
      if (fresh?.status === "COMPLETED") {
        const metaDone = safeJson(fresh.metadataJson);
        const apiKey = getOneTimeApiKeyFromMeta(metaDone);
        return Response.json({ ok: true, status: "COMPLETED", result, apiKey });
      }
      return Response.json({ ok: true, status: "COMPLETED", result });
    }

    await createTransactionAndUpdateBalance({
      userId: payment.userId,
      type: "TOP_UP",
      amountCents: payment.creditsCents,
      note: "M-Pesa top-up (verified by query)",
    });
    await postBalanceSideEffects(payment.userId);

    const meta = completedMeta;
    if (meta.intent === "SPEND" && typeof meta.modelKey === "string" && typeof meta.tokens === "number") {
      await createTransactionAndUpdateBalance({
        userId: payment.userId,
        type: "SPEND",
        amountCents: -payment.creditsCents,
        modelKey: meta.modelKey,
        note: `Paid usage: ${meta.tokens} tokens (verified by query)`,
      });
      await postBalanceSideEffects(payment.userId);
    }

    // Always provide a one-time copyable key for THIS payment (even if the user already has other keys).
    // We store it encrypted in payment metadata for a short window so the user can still copy it if they missed the UI.
    const metaAfterTopup = safeJson((await prisma.payment.findUnique({
      where: { id: payment.id },
      select: { metadataJson: true },
    }))?.metadataJson ?? null);

    const existingOneTime = getOneTimeApiKeyFromMeta(metaAfterTopup);
    let createdApiKey: string | null = existingOneTime;
    if (!createdApiKey) {
      const created = await createApiKey({
        userId: payment.userId,
        environment: payment.environment,
        label: "Checkout key",
      });
      createdApiKey = created.key;
      const updatedMeta = {
        ...metaAfterTopup,
        oneTimeApiKeyEnc: encryptOneTimeApiKey(created.key),
        oneTimeApiKeyCreatedAt: new Date().toISOString(),
      };
      await prisma.payment.update({
        where: { id: payment.id },
        data: { metadataJson: JSON.stringify(updatedMeta) },
      });
    }

    return Response.json({ ok: true, status: "COMPLETED", result, apiKey: createdApiKey });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, { error: "BAD_INPUT", message: "Invalid request body.", context: { issues: err.issues } });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

function safeJson(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}

function interpretResultCode(code: string | undefined) {
  if (!code) return "PENDING" as const;
  if (code === "0") return "COMPLETED" as const;
  if (code === "4999") return "PENDING" as const;
  return "FAILED" as const;
}

const ONE_TIME_KEY_TTL_MS = 10 * 60 * 1000;

function getOneTimeApiKeyFromMeta(meta: Record<string, unknown>) {
  const enc = typeof meta.oneTimeApiKeyEnc === "string" ? meta.oneTimeApiKeyEnc : null;
  const createdAtRaw = typeof meta.oneTimeApiKeyCreatedAt === "string" ? meta.oneTimeApiKeyCreatedAt : null;
  if (!enc || !createdAtRaw) return null;
  const createdAtMs = Date.parse(createdAtRaw);
  if (!Number.isFinite(createdAtMs)) return null;
  if (Date.now() - createdAtMs > ONE_TIME_KEY_TTL_MS) return null;
  return decryptOneTimeApiKey(enc);
}

function secretKey32() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptOneTimeApiKey(plain: string) {
  const iv = crypto.randomBytes(12);
  const key = secretKey32();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plain, "utf8")), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${ciphertext.toString("base64")}.${tag.toString("base64")}`;
}

function decryptOneTimeApiKey(enc: string) {
  try {
    const [ivB64, ctB64, tagB64] = enc.split(".");
    if (!ivB64 || !ctB64 || !tagB64) return null;
    const iv = Buffer.from(ivB64, "base64");
    const ciphertext = Buffer.from(ctB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const key = secretKey32();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    return plain || null;
  } catch {
    return null;
  }
}

