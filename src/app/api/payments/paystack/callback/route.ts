import { createApiKey } from "@/server/api-keys";
import { createTransactionAndUpdateBalance, postBalanceSideEffects } from "@/server/credits";
import { prisma } from "@/server/db";
import { verifyPaystack } from "@/server/paystack";

export const runtime = "nodejs";

function getRedirectBaseUrl(fallbackOrigin: string) {
  const configured = process.env.APP_BASE_URL?.trim();
  if (!configured) return fallbackOrigin;
  return configured.replace(/\/+$/, "");
}

function redirectToDashboard(origin: string, status: string) {
  return Response.redirect(new URL(`/dashboard?paystack=${encodeURIComponent(status)}`, getRedirectBaseUrl(origin)));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");
  if (!reference) {
    return redirectToDashboard(url.origin, "missing_reference");
  }

  try {
    const payment = await prisma.payment.findFirst({
      where: { provider: "PAYSTACK", providerRef: reference },
      select: { id: true, userId: true, status: true, creditsCents: true, environment: true },
    });
    if (!payment) {
      return redirectToDashboard(url.origin, "payment_not_found");
    }

    if (payment.status === "COMPLETED") {
      return redirectToDashboard(url.origin, "success");
    }

    const verified = await verifyPaystack(reference);
    const paid = verified.status.toLowerCase() === "success";

    if (!paid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", metadataJson: JSON.stringify({ verify: verified }) },
      });
      return redirectToDashboard(url.origin, "failed");
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", metadataJson: JSON.stringify({ verify: verified }) },
    });

    await createTransactionAndUpdateBalance({
      userId: payment.userId,
      type: "TOP_UP",
      amountCents: payment.creditsCents,
      note: `Paystack card top-up (${reference})`,
    });
    await postBalanceSideEffects(payment.userId);

    const existingKey = await prisma.apiKey.findFirst({
      where: { userId: payment.userId, environment: payment.environment, revokedAt: null },
      select: { id: true },
    });
    if (!existingKey) {
      await createApiKey({
        userId: payment.userId,
        environment: payment.environment,
        label: "Production key",
      });
    }

    return redirectToDashboard(url.origin, "success");
  } catch {
    return redirectToDashboard(url.origin, "error");
  }
}

