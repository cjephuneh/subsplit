/**
 * Baseline marketplace models (upserted by `npm run prisma:seed`).
 * Admin-added rows are preserved — seed only upserts these keys, it does not delete others.
 * Add more models from Admin when ready.
 */
export type DefaultModelOffering = {
  key: string;
  name: string;
  provider: string;
  description: string;
  modelType: "TEXT" | "VOICE" | "IMAGE" | "VIDEO" | "EMBEDDING";
  inputCentsPer1kTokens: number;
  outputCentsPer1kTokens: number;
  supportsChat: boolean;
  supportsImage: boolean;
  supportsVideo: boolean;
  imageUrl: string | null;
  deploymentName?: string | null;
};

export const DEFAULT_MODEL_OFFERINGS: DefaultModelOffering[] = [
  {
    key: "gpt-4",
    name: "GPT-4",
    provider: "Azure OpenAI",
    description: "Default model. Add more models from Admin when ready.",
    modelType: "TEXT",
    inputCentsPer1kTokens: 25,
    outputCentsPer1kTokens: 100,
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
];
