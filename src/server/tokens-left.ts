import { z } from "zod";

export const TokensLeftInputSchema = z.object({
  remainingCents: z.number().int().min(0),
  blendedCentsPer1kTokens: z.number().positive(),
});

export function estimateTokensLeft(input: { remainingCents: number; blendedCentsPer1kTokens: number }) {
  const parsed = TokensLeftInputSchema.parse(input);
  // tokensLeft = floor(remainingCents / (blendedCentsPer1kTokens / 1000))
  // = floor(remainingCents * 1000 / blendedCentsPer1kTokens)
  return Math.floor((parsed.remainingCents * 1000) / parsed.blendedCentsPer1kTokens);
}

