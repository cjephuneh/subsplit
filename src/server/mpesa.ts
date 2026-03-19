import crypto from "node:crypto";
import { z } from "zod";

const DarajaEnvSchema = z.enum(["production", "sandbox"]);
export type DarajaEnv = z.infer<typeof DarajaEnvSchema>;

function getDarajaEnv(): DarajaEnv {
  return DarajaEnvSchema.parse(process.env.DARAJA_ENV ?? "production");
}

function getConfig() {
  const env = getDarajaEnv();

  const isSandbox = env === "sandbox";
  const consumerKey = isSandbox
    ? process.env.DARAJA_SANDBOX_CONSUMER_KEY ?? process.env.DARAJA_CONSUMER_KEY
    : process.env.DARAJA_CONSUMER_KEY;
  const consumerSecret = isSandbox
    ? process.env.DARAJA_SANDBOX_CONSUMER_SECRET ?? process.env.DARAJA_CONSUMER_SECRET
    : process.env.DARAJA_CONSUMER_SECRET;
  const shortcode = isSandbox
    ? process.env.DARAJA_SANDBOX_SHORTCODE ?? process.env.DARAJA_SHORTCODE
    : process.env.DARAJA_SHORTCODE;
  const passkey = isSandbox
    ? process.env.DARAJA_SANDBOX_PASSKEY ?? process.env.DARAJA_PASSKEY
    : process.env.DARAJA_PASSKEY;

  if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
    throw new Error("Missing Daraja credentials");
  }

  const baseUrl = isSandbox
    ? "https://sandbox.safaricom.co.ke"
    : "https://api.safaricom.co.ke";

  const callbackUrlOverride = process.env.DARAJA_CALLBACK_URL;
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!callbackUrlOverride && !appBaseUrl) {
    throw new Error("Missing APP_BASE_URL");
  }

  const callbackUrl = callbackUrlOverride
    ? callbackUrlOverride
    : new URL("/api/payments/mpesa/callback", appBaseUrl!).toString();

  return { env, baseUrl, consumerKey, consumerSecret, shortcode, passkey, callbackUrl };
}

async function getAccessToken() {
  const cfg = getConfig();
  const auth = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString("base64");

  const res = await fetch(`${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Daraja auth failed (${res.status}): ${safeJsonString(json)}`);
  }
  const parsed = z.object({ access_token: z.string() }).safeParse(json);
  if (!parsed.success) throw new Error(`Daraja auth failed (bad response): ${safeJsonString(json)}`);
  return parsed.data.access_token;
}

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}${pad(d.getSeconds())}`;
}

function password(shortcode: string, passkey: string, ts: string) {
  return Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");
}

export const PhoneNumberSchema = z
  .preprocess((v) => {
    if (typeof v !== "string") return v;
    return normalizePhoneNumber(v);
  }, z.string().regex(/^2547\d{8}$/, "Phone must be a Kenyan mobile number"))
  .describe("Normalized to 2547XXXXXXXX");

export function normalizePhoneNumber(input: string) {
  const raw = input.trim().replace(/\s+/g, "");
  if (raw.startsWith("+")) return normalizePhoneNumber(raw.slice(1));
  if (raw.startsWith("07") && raw.length === 10) return `254${raw.slice(1)}`;
  if (raw.startsWith("7") && raw.length === 9) return `254${raw}`;
  return raw;
}

export async function initiateStkPush(input: {
  phoneNumber: string; // 2547XXXXXXXX
  amountKes: number; // integer
  accountReference: string;
  transactionDesc: string;
}) {
  const cfg = getConfig();
  const token = await getAccessToken();
  const ts = timestamp();

  const body = {
    BusinessShortCode: cfg.shortcode,
    Password: password(cfg.shortcode, cfg.passkey, ts),
    Timestamp: ts,
    TransactionType: "CustomerPayBillOnline",
    Amount: input.amountKes,
    PartyA: input.phoneNumber,
    PartyB: cfg.shortcode,
    PhoneNumber: input.phoneNumber,
    CallBackURL: cfg.callbackUrl,
    AccountReference: input.accountReference,
    TransactionDesc: input.transactionDesc,
  };

  const res = await fetch(`${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`STK push failed (${res.status}): ${safeJsonString(json)}`);
  const StkResponseSchema = z.object({
    MerchantRequestID: z.string(),
    CheckoutRequestID: z.string(),
    ResponseCode: z.string(),
    ResponseDescription: z.string(),
    CustomerMessage: z.string(),
  });
  const parsed = StkResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`STK push failed (bad response): ${safeJsonString(json)}`);
  }
  if (parsed.data.ResponseCode !== "0") {
    throw new Error(`STK push failed (ResponseCode ${parsed.data.ResponseCode}): ${parsed.data.ResponseDescription}`);
  }
  return parsed.data;
}

export async function queryStkPush(input: { checkoutRequestId: string }) {
  const cfg = getConfig();
  const token = await getAccessToken();
  const ts = timestamp();

  const body = {
    BusinessShortCode: cfg.shortcode,
    Password: password(cfg.shortcode, cfg.passkey, ts),
    Timestamp: ts,
    CheckoutRequestID: input.checkoutRequestId,
  };

  const res = await fetch(`${cfg.baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`STK query failed (${res.status}): ${safeJsonString(json)}`);

  const QuerySchema = z.object({
    ResponseCode: z.string(),
    ResponseDescription: z.string(),
    MerchantRequestID: z.string().optional(),
    CheckoutRequestID: z.string().optional(),
    ResultCode: z.string().optional(),
    ResultDesc: z.string().optional(),
  });
  const parsed = QuerySchema.safeParse(json);
  if (!parsed.success) throw new Error(`STK query failed (bad response): ${safeJsonString(json)}`);
  return parsed.data;
}

export type StkCallback = {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
};

export const StkCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number().int(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            }),
          ),
        })
        .optional(),
    }),
  }),
});

export function extractCallbackValue(
  cb: z.infer<typeof StkCallbackSchema>,
  name: string,
) {
  const items = cb.Body.stkCallback.CallbackMetadata?.Item ?? [];
  const found = items.find((i) => i.Name === name);
  return found?.Value;
}

export function idempotencyKey(parts: string[]) {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}

function safeJsonString(value: unknown) {
  try {
    const s = JSON.stringify(value);
    if (s.length <= 2000) return s;
    return `${s.slice(0, 2000)}…`;
  } catch {
    return String(value);
  }
}

