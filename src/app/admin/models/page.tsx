export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { requireAdminUser } from "@/server/auth";

import { AdminModelsClient } from "./ui";

export default async function AdminModelsPage() {
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

  return <AdminModelsClient initialModels={models} />;
}

