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

export type AzureChatRouting = {
  /** Admin "deployment name" — must match Azure Portal deployment name when using shared endpoint. */
  catalogDeploymentName?: string | null;
  /** Subsplit model key from the API body (e.g. gpt-5-chat); used as Azure deployment name if catalog name is empty. */
  requestModelKey?: string;
};

/** Which name was chosen for `/openai/deployments/{name}/...` (for errors / logs). */
export type SharedDeploymentResolution = {
  deployment: string;
  source: "catalog" | "request" | "env";
};

/**
 * Resolves the Azure deployment segment for the shared-endpoint path (same order as {@link azureChatCompletions}).
 * Catalog wins when set so Admin can map a Subsplit model key to a different Azure deployment name.
 */
export function resolveSharedAzureDeployment(
  cfg: { deployment: string },
  routing: AzureChatRouting | null,
): SharedDeploymentResolution {
  const cat = routing?.catalogDeploymentName?.trim();
  if (cat) {
    return { deployment: cat, source: "catalog" };
  }
  const req = routing?.requestModelKey?.trim();
  if (req) {
    return { deployment: req, source: "request" };
  }
  return { deployment: cfg.deployment, source: "env" };
}

/** Azure OpenAI / AI Studio resource hosts (not OpenAI’s api.openai.com). */
function isAzureOpenAiResourceHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h.endsWith(".openai.azure.com") ||
    h.endsWith(".cognitiveservices.azure.com") ||
    h.endsWith(".services.ai.azure.com")
  );
}

function azureOpenAiChatUrl(resourceOrigin: string, deployment: string, apiVersion: string) {
  const url = new URL(
    `/openai/deployments/${encodeURIComponent(deployment)}/chat/completions`,
    resourceOrigin,
  );
  url.searchParams.set("api-version", apiVersion);
  return url.toString();
}

function chatRequestBodyNoModel(input: ChatCompletionsRequest) {
  return JSON.stringify({
    messages: input.messages,
    temperature: input.temperature,
    max_tokens: input.max_tokens,
  });
}

export async function azureChatCompletions(
  input: ChatCompletionsRequest,
  override?: ModelEndpointOverride | null,
  routing?: AzureChatRouting | null,
) {
  // Per-model endpoint: Azure resources need native REST shape, not OpenAI /v1 + Bearer + body.model.
  if (override?.endpoint && override?.apiKey) {
    const base = override.endpoint.trim().replace(/\/+$/, "");
    const deployment = override.deployment.trim();
    let parsed: URL;
    try {
      parsed = new URL(base);
    } catch {
      throw new Error("MODEL_CONFIG_INVALID: endpoint URL is not valid.");
    }

    if (isAzureOpenAiResourceHost(parsed.hostname)) {
      const resourceOrigin = `${parsed.protocol}//${parsed.host}`;
      const apiVersion =
        getAzureEvalConfig()?.apiVersion ??
        process.env.AZURE_OPENAI_EVAL_API_VERSION ??
        "2024-10-21-preview";
      const url = azureOpenAiChatUrl(resourceOrigin, deployment, apiVersion);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "api-key": override.apiKey,
        },
        body: chatRequestBodyNoModel(input),
      });

      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          `AZURE_OPENAI_ERROR:${res.status}:${safeJsonString(json)}`,
        );
      }
      return json;
    }

    // Non-Azure: OpenAI-compatible base URL + /chat/completions (e.g. Anthropic gateway, OpenAI).
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

  // Fallback: same Azure resource/key as .env, but deployment can come from the catalog or request model key.
  const cfg = getAzureEvalConfig();
  if (!cfg) {
    throw new Error("MODEL_CONFIG_MISSING: No endpoint configured for this model in DB, and no system-level .env fallback found.");
  }

  const { deployment } = resolveSharedAzureDeployment(cfg, routing ?? null);

  const url = new URL(
    `/openai/deployments/${encodeURIComponent(deployment)}/chat/completions`,
    cfg.endpoint,
  );
  url.searchParams.set("api-version", cfg.apiVersion);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": cfg.apiKey,
    },
    body: chatRequestBodyNoModel(input),
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

