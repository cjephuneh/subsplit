import { authenticateApiKey } from "@/server/api-keys";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { writeApiKeyUsageLog } from "@/server/usage-logs";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const key = await authenticateApiKey(auth);
  if (!key) {
    return jsonError(401, {
      error: "UNAUTHORIZED",
      message: "Missing or invalid API key.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: key.userId },
    select: { id: true, email: true, displayName: true },
  });
  if (!user) {
    return jsonError(401, { error: "UNAUTHORIZED", message: "Invalid API key." });
  }

  const wallet = await prisma.creditWallet.findUnique({
    where: { userId: user.id },
    select: { balanceCents: true, lowBalanceCentsThreshold: true },
  });

  const res = Response.json({
    ok: true,
    user,
    wallet: wallet ?? { balanceCents: 0, lowBalanceCentsThreshold: 10000 },
  });

  await writeApiKeyUsageLog({
    apiKeyId: key.id,
    userId: key.userId,
    method: "GET",
    path: "/api/sandbox/ping",
    status: 200,
    ip: req.headers.get("x-forwarded-for"),
    userAgent: req.headers.get("user-agent"),
  });

  return res;
}

