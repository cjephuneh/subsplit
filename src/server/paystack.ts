import { z } from "zod";

const InitResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    authorization_url: z.string().url(),
    access_code: z.string(),
    reference: z.string(),
  }),
});

const VerifyResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    reference: z.string(),
    status: z.string(),
    amount: z.number().int().nonnegative(),
    paid_at: z.string().nullable().optional(),
    channel: z.string().nullable().optional(),
    gateway_response: z.string().nullable().optional(),
  }),
});

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Missing PAYSTACK_SECRET_KEY");
  return key;
}

function getPublicBaseUrl() {
  const base = process.env.APP_BASE_URL;
  if (!base) throw new Error("Missing APP_BASE_URL");
  return base.replace(/\/+$/, "");
}

export async function initializePaystackCheckout(input: {
  email: string;
  amountKobo: number;
  reference: string;
  metadata: Record<string, unknown>;
}) {
  const callbackUrl = `${getPublicBaseUrl()}/api/payments/paystack/callback`;
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      authorization: `Bearer ${getSecretKey()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: callbackUrl,
      metadata: input.metadata,
      currency: "KES",
    }),
  });
  const json: unknown = await res.json().catch(() => null);
  const parsed = InitResponseSchema.safeParse(json);
  if (!res.ok || !parsed.success || !parsed.data.status) {
    throw new Error(`PAYSTACK_INIT_FAILED:${res.status}:${JSON.stringify(json)}`);
  }
  return {
    authorizationUrl: parsed.data.data.authorization_url,
    reference: parsed.data.data.reference,
  };
}

export async function verifyPaystack(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { authorization: `Bearer ${getSecretKey()}` },
  });
  const json: unknown = await res.json().catch(() => null);
  const parsed = VerifyResponseSchema.safeParse(json);
  if (!res.ok || !parsed.success || !parsed.data.status) {
    throw new Error(`PAYSTACK_VERIFY_FAILED:${res.status}:${JSON.stringify(json)}`);
  }
  return parsed.data.data;
}

