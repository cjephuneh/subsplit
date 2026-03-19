import { z } from "zod";

const AzureConfigSchema = z.object({
  endpoint: z.string().url(),
  apiKey: z.string().min(1),
  deployment: z.string().min(1),
  apiVersion: z.string().min(1),
});

export function getAzureEvalConfig() {
  const env = {
    endpoint: process.env.AZURE_OPENAI_EVAL_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_EVAL_API_KEY,
    deployment: process.env.AZURE_OPENAI_EVAL_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_EVAL_API_VERSION,
  };

  const parsed = AzureConfigSchema.safeParse(env);
  if (!parsed.success) return null;
  return parsed.data;
}

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const ChatCompletionsRequestSchema = z.object({
  model: z.string().optional(),
  messages: z.array(MessageSchema).min(1).max(100),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(4096).optional(),
});

export type ChatCompletionsRequest = z.infer<typeof ChatCompletionsRequestSchema>;

/** Optional per-model override config (stored in the database). */
export type ModelEndpointOverride = {
  endpoint: string;
  apiKey: string;
  deployment: string;
};

export async function azureChatCompletions(
  input: ChatCompletionsRequest,
  override?: ModelEndpointOverride | null,
) {
  // If the model has its own endpoint config, use the OpenAI-compatible path
  if (override?.endpoint && override?.apiKey) {
    const base = override.endpoint.replace(/\/+$/, "");
    const url = `${base}/chat/completions`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${override.apiKey}`,
      },
      body: JSON.stringify({
        model: override.deployment,
        messages: input.messages,
        temperature: input.temperature,
        max_tokens: input.max_tokens,
      }),
    });

    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        `AZURE_OPENAI_ERROR:${res.status}:${safeJsonString(json)}`,
      );
    }
    return json;
  }

  // Fallback: use the system-level Azure OpenAI config from .env
  const cfg = getAzureEvalConfig();
  if (!cfg) {
    throw new Error("MODEL_CONFIG_MISSING: No endpoint configured for this model in DB, and no system-level .env fallback found.");
  }

  const url = new URL(
    `/openai/deployments/${encodeURIComponent(cfg.deployment)}/chat/completions`,
    cfg.endpoint,
  );
  url.searchParams.set("api-version", cfg.apiVersion);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": cfg.apiKey,
    },
    body: JSON.stringify({
      messages: input.messages,
      temperature: input.temperature,
      max_tokens: input.max_tokens,
    }),
  });

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      `AZURE_OPENAI_ERROR:${res.status}:${safeJsonString(json)}`,
    );
  }
  return json;
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

