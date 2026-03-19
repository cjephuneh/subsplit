import { PrismaClient } from "../src/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const models = [
    // Only ship one model by default. Add more via Admin later.
    {
      key: "gpt-4",
      name: "GPT-4",
      provider: "Azure OpenAI",
      description: "Default model. Add more models from Admin when ready.",
      modelType: "TEXT",
      inputCentsPer1kTokens: 25, // ~0.25 KES
      outputCentsPer1kTokens: 100, // ~1.00 KES
      supportsChat: true,
      supportsImage: false,
      supportsVideo: false,
      imageUrl: "/models/gpt-4.png",
    },
    {
      key: "grok-4",
      name: "Grok 4",
      provider: "xAI",
      description: "Fast and witty model from xAI.",
      modelType: "TEXT",
      inputCentsPer1kTokens: 15,
      outputCentsPer1kTokens: 60,
      supportsChat: true,
      supportsImage: false,
      supportsVideo: false,
      imageUrl: "/models/grok.png",
    },
  ] as const;

  // Remove any old seed models so the UI only shows what's actually available.
  await prisma.modelOffering.deleteMany({
    where: { key: { notIn: models.map((m) => m.key) } },
  });

  for (const model of models) {
    await prisma.modelOffering.upsert({
      where: { key: model.key },
      update: {
        name: model.name,
        provider: model.provider,
        description: model.description,
        modelType: model.modelType,
        inputCentsPer1kTokens: model.inputCentsPer1kTokens,
        outputCentsPer1kTokens: model.outputCentsPer1kTokens,
        supportsChat: model.supportsChat,
        supportsImage: model.supportsImage,
        supportsVideo: model.supportsVideo,
        imageUrl: model.imageUrl,
      },
      create: model,
    });
  }
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

