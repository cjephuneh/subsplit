import { z } from "zod";

import { authenticateApiKey } from "@/server/api-keys";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";
import { azureChatCompletions, ChatCompletionsRequestSchema, type ModelEndpointOverride } from "@/server/azure-openai";
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

  let body: any = null;
  try {
    body = await parseJson(req, BodySchema);

    const model = await prisma.modelOffering.findUnique({
      where: { key: body.model },
      select: {
        key: true,
        modelType: true,
        supportsChat: true,
        creditsPer1kTokensCents: true,
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

    // Current implementation: route all chat to your Azure eval deployment.
    const azureResponse = await azureChatCompletions(
      {
        messages: body.messages,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
      },
      override,
    );

    const usage = z
      .object({
        usage: z
          .object({
            total_tokens: z.number().int().nonnegative(),
          })
          .optional(),
      })
      .safeParse(azureResponse);

    const totalTokens = usage.success ? usage.data.usage?.total_tokens ?? null : null;
    if (!totalTokens) {
      return jsonError(502, {
        error: "UPSTREAM_NO_USAGE",
        message: "Upstream response missing token usage; cannot charge credits safely.",
      });
    }

    const costCents = costCentsForTokens({
      tokens: totalTokens,
      centsPer1k: model.creditsPer1kTokensCents,
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
        totalTokens,
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
      return jsonError(502, {
        error: "UPSTREAM_ERROR",
        message: "Azure OpenAI request failed.",
        context: { details: err.message },
      });
    }

    if (err instanceof Error && err.message.startsWith("INSUFFICIENT_FUNDS")) {
      return jsonError(402, { error: "INSUFFICIENT_FUNDS", message: "Not enough credits." });
    }

    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

