import { createApiKey } from "@/server/api-keys";
import { createTransactionAndUpdateBalance, postBalanceSideEffects } from "@/server/credits";
import { prisma } from "@/server/db";
import { verifyPaystack } from "@/server/paystack";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");
  if (!reference) {
    return Response.redirect(new URL("/dashboard?paystack=missing_reference", url.origin));
  }

  try {
    const payment = await prisma.payment.findFirst({
      where: { provider: "PAYSTACK", providerRef: reference },
      select: { id: true, userId: true, status: true, creditsCents: true, environment: true },
    });
    if (!payment) {
      return Response.redirect(new URL("/dashboard?paystack=payment_not_found", url.origin));
    }

    if (payment.status === "COMPLETED") {
      return Response.redirect(new URL("/dashboard?paystack=success", url.origin));
    }

    const verified = await verifyPaystack(reference);
    const paid = verified.status.toLowerCase() === "success";

    if (!paid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", metadataJson: JSON.stringify({ verify: verified }) },
      });
      return Response.redirect(new URL("/dashboard?paystack=failed", url.origin));
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

    return Response.redirect(new URL("/dashboard?paystack=success", url.origin));
  } catch {
    return Response.redirect(new URL("/dashboard?paystack=error", url.origin));
  }
}

