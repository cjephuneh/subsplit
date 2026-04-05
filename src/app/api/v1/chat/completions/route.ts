import { z } from "zod";

import { authenticateApiKey } from "@/server/api-keys";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";
import {
  azureChatCompletions,
  ChatCompletionsRequestSchema,
  getAzureEvalConfig,
  resolveSharedAzureDeployment,
  type ModelEndpointOverride,
} from "@/server/azure-openai";
import { costCentsForTokens } from "@/server/pricing";
import { writeApiKeyUsageLog } from "@/server/usage-logs";
import { createTransactionAndUpdateBalance } from "@/server/credits";

export const runtime = "nodejs";

const BodySchema = ChatCompletionsRequestSchema.extend({
  // client selects a Subsplit model key (we map it server-side)
  model: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  const started = Date.now();
  const auth = req.headers.get("authorization");
  const key = await authenticateApiKey(auth);

  if (!key) {
    return jsonError(401, { error: "UNAUTHORIZED", message: "Missing or invalid API key." });
  }

  let body: z.infer<typeof BodySchema> | null = null;
  let azureDebug: {
    deployment: string;
    source: "catalog" | "request" | "env" | "per_model_endpoint";
    endpointHost?: string;
  } | null = null;

  try {
    body = await parseJson(req, BodySchema);

    const model = await prisma.modelOffering.findUnique({
      where: { key: body.model },
      select: {
        key: true,
        modelType: true,
        supportsChat: true,
        inputCentsPer1kTokens: true,
        outputCentsPer1kTokens: true,
        endpointUrl: true,
        apiKey: true,
        deploymentName: true,
      },
    });
    if (!model || !model.supportsChat) {
      return jsonError(404, { error: "MODEL_NOT_FOUND", message: "Model is not available for chat." });
    }

    // Build per-model override if configured, otherwise fallback to .env
    const override: ModelEndpointOverride | null =
      model.endpointUrl && model.apiKey
        ? {
          endpoint: model.endpointUrl,
          apiKey: model.apiKey,
          deployment: model.deploymentName ?? body.model,
        }
        : null;

    if (override) {
      azureDebug = {
        deployment: model.deploymentName?.trim() || body.model,
        source: "per_model_endpoint",
      };
    } else {
      const cfg = getAzureEvalConfig();
      if (cfg) {
        const r = resolveSharedAzureDeployment(cfg, {
          catalogDeploymentName: model.deploymentName,
          requestModelKey: body.model,
        });
        azureDebug = {
          deployment: r.deployment,
          source: r.source,
          endpointHost: new URL(cfg.endpoint).host,
        };
      }
    }

    const azureResponse = await azureChatCompletions(
      {
        messages: body.messages,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
      },
      override,
      override
        ? null
        : {
            catalogDeploymentName: model.deploymentName,
            requestModelKey: body.model,
          },
    );

    const usage = z
      .object({
        usage: z
          .object({
            prompt_tokens: z.number().int().nonnegative(),
            completion_tokens: z.number().int().nonnegative(),
            total_tokens: z.number().int().nonnegative(),
          })
          .optional(),
      })
      .safeParse(azureResponse);

    const usageData = usage.success ? usage.data.usage : null;
    const promptTokens = usageData?.prompt_tokens ?? null;
    const completionTokens = usageData?.completion_tokens ?? null;
    
    if (promptTokens === null || completionTokens === null) {
      return jsonError(502, {
        error: "UPSTREAM_NO_USAGE",
        message: "Upstream response missing token usage; cannot charge credits safely.",
      });
    }

    const costCents = costCentsForTokens({
      promptTokens,
      completionTokens,
      inputCentsPer1k: model.inputCentsPer1kTokens,
      outputCentsPer1k: model.outputCentsPer1kTokens,
    });

    // Direct billing to the user's master wallet
    const { wallet } = await createTransactionAndUpdateBalance({
      userId: key.userId,
      type: "SPEND",
      amountCents: -costCents,
      modelKey: model.key,
      note: `API call: ${model.key}`,
    });

    await writeApiKeyUsageLog({
      apiKeyId: key.id,
      userId: key.userId,
      method: "POST",
      path: "/api/v1/chat/completions",
      status: 200,
      modelKey: model.key,
      ip: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
    });

    const responseObject =
      typeof azureResponse === "object" && azureResponse && !Array.isArray(azureResponse)
        ? (azureResponse as Record<string, unknown>)
        : { data: azureResponse };

    return Response.json({
      ...responseObject,
      subsplit: {
        modelKey: model.key,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        costCents,
        walletRemainingCents: wallet.balanceCents, // Now returning wallet balance
        latencyMs: Date.now() - started,
      },
    });
  } catch (err) {
    const status = err instanceof Error && err.message.startsWith("INSUFFICIENT_FUNDS") ? 402 : 500;

    await writeApiKeyUsageLog({
      apiKeyId: key.id,
      userId: key.userId,
      method: "POST",
      path: "/api/v1/chat/completions",
      status,
      modelKey: body?.model ?? null, // use the model from the body if available
      ip: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
    });

    if (err instanceof z.ZodError) {
      return jsonError(400, { error: "BAD_INPUT", message: "Invalid request body.", context: { issues: err.issues } });
    }

    if (err instanceof Error && err.message.startsWith("AZURE_OPENAI_ERROR:")) {
      const is404 = err.message.includes("AZURE_OPENAI_ERROR:404");
      return jsonError(502, {
        error: "UPSTREAM_ERROR",
        message: is404
          ? "Azure returned 404 (deployment not found). That is unrelated to Postgres: the deployment name in the request must exist on your Azure OpenAI resource. In Azure AI Foundry / OpenAI → Deployments, copy the exact deployment name. Set it in Admin on the model (Deployment name), or clear Deployment name to use the Subsplit model key. Ensure Web App settings include AZURE_OPENAI_EVAL_ENDPOINT, API key, and AZURE_OPENAI_EVAL_DEPLOYMENT."
          : "Azure OpenAI request failed.",
        context: {
          details: err.message,
          ...(is404 && azureDebug
            ? {
                azureDeploymentUsed: azureDebug.deployment,
                azureDeploymentSource: azureDebug.source,
                ...(azureDebug.endpointHost
                  ? { azureEndpointHost: azureDebug.endpointHost }
                  : {}),
              }
            : {}),
        },
      });
    }

    if (err instanceof Error && err.message.startsWith("INSUFFICIENT_FUNDS")) {
      return jsonError(402, { error: "INSUFFICIENT_FUNDS", message: "Not enough credits." });
    }

    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

