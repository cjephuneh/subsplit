import { prisma } from "@/server/db";

export const runtime = "nodejs";

export async function GET() {
  const models = await prisma.modelOffering.findMany({
    orderBy: { creditsPer1kTokensCents: "asc" },
    select: {
      key: true,
      name: true,
      provider: true,
      modelType: true,
      description: true,
      creditsPer1kTokensCents: true,
      supportsChat: true,
      supportsImage: true,
      supportsVideo: true,
      imageUrl: true,
    },
  });

  return Response.json({ models });
}

