import { z } from "zod";

import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";
import { parseJson } from "@/server/request";

export const runtime = "nodejs";

const CreateSchema = z.object({
  key: z.string().min(2).max(80),
  name: z.string().min(2).max(80),
  provider: z.string().min(2).max(80),
  description: z.string().min(0).max(280),
  modelType: z.enum(["TEXT", "VOICE", "IMAGE", "VIDEO", "EMBEDDING"]),
  creditsPer1kTokensCents: z.number().int().min(1).max(100_000),
  supportsChat: z.boolean().optional(),
  supportsImage: z.boolean().optional(),
  supportsVideo: z.boolean().optional(),
  endpointUrl: z.string().url().max(500).optional().or(z.literal("")),
  apiKey: z.string().max(500).optional().or(z.literal("")),
  deploymentName: z.string().max(200).optional().or(z.literal("")),
});

export async function GET() {
  try {
    await requireAdminUser();
    const models = await prisma.modelOffering.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        key: true,
        name: true,
        provider: true,
        description: true,
        modelType: true,
        creditsPer1kTokensCents: true,
        supportsChat: true,
        supportsImage: true,
        supportsVideo: true,
        endpointUrl: true,
        apiKey: true,
        deploymentName: true,
        updatedAt: true,
      },
    });
    return Response.json({ models });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return jsonError(403, { error: "FORBIDDEN", message: "Admins only." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminUser();
    const body = await parseJson(req, CreateSchema);

    const created = await prisma.modelOffering.create({
      data: {
        key: body.key,
        name: body.name,
        provider: body.provider,
        description: body.description,
        modelType: body.modelType,
        creditsPer1kTokensCents: body.creditsPer1kTokensCents,
        supportsChat: body.supportsChat ?? true,
        supportsImage: body.supportsImage ?? false,
        supportsVideo: body.supportsVideo ?? false,
        endpointUrl: body.endpointUrl || null,
        apiKey: body.apiKey || null,
        deploymentName: body.deploymentName || null,
      },
      select: { key: true },
    });

    return Response.json({ ok: true, modelKey: created.key });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, { error: "BAD_INPUT", message: "Invalid request body.", context: { issues: err.issues } });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return jsonError(403, { error: "FORBIDDEN", message: "Admins only." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}

