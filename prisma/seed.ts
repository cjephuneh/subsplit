import { prisma } from "../src/server/db";

import { DEFAULT_MODEL_OFFERINGS } from "./default-model-offerings";

async function main() {
  for (const model of DEFAULT_MODEL_OFFERINGS) {
    const { deploymentName: _d, ...rest } = model;
    await prisma.modelOffering.upsert({
      where: { key: model.key },
      update: {
        name: rest.name,
        provider: rest.provider,
        description: rest.description,
        modelType: rest.modelType,
        inputCentsPer1kTokens: rest.inputCentsPer1kTokens,
        outputCentsPer1kTokens: rest.outputCentsPer1kTokens,
        supportsChat: rest.supportsChat,
        supportsImage: rest.supportsImage,
        supportsVideo: rest.supportsVideo,
        imageUrl: rest.imageUrl,
        // Do not overwrite endpointUrl, apiKey, deploymentName — Admin may have set these.
      },
      create: {
        ...rest,
        deploymentName: model.deploymentName ?? null,
      },
    });
  }

  console.log(
    `Seeded ${DEFAULT_MODEL_OFFERINGS.length} default model offerings (upsert). Other rows were left unchanged.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
