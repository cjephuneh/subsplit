import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const BodySchema = z.object({
    key: z.string().min(10).max(100),
});

function sha256(value: string) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Public endpoint to revoke leaked API keys.
 * This mimics the GitHub Secret Scanning Partner API.
 */
export async function POST(req: Request) {
    try {
        const body = await parseJson(req, BodySchema);
        const token = body.key;

        const tokenPrefix = token.slice(0, 12);
        const keyHash = sha256(token);

        const apiKey = await prisma.apiKey.findFirst({
            where: { prefix: tokenPrefix, keyHash, revokedAt: null },
            select: { id: true, userId: true, label: true },
        });

        if (!apiKey) {
            return Response.json({ ok: true, status: "ALREADY_REVOKED_OR_INVALID" });
        }

        // Revoke the key
        await prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { revokedAt: new Date() },
        });

        // Notify the user
        await prisma.notification.create({
            data: {
                userId: apiKey.userId,
                type: "SYSTEM",
                title: "Security Alert: Key Leaked",
                message: `Your API key "${apiKey.label}" (${apiKey.prefix}…) was found on a public platform and has been automatically revoked to protect your wallet balance.`,
            },
        });

        return Response.json({
            ok: true,
            status: "REVOKED",
            message: `Key ${apiKey.prefix}… has been successfully revoked.`
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return jsonError(400, { error: "BAD_INPUT", message: "Invalid request body." });
        }
        console.error("Leak revocation error:", err);
        return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
    }
}
