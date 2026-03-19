import { z } from "zod";

export const TokensLeftInputSchema = z.object({
  remainingCents: z.number().int().min(0),
  centsPer1kTokens: z.number().int().positive(),
});

export function estimateTokensLeft(input: { remainingCents: number; centsPer1kTokens: number }) {
  const parsed = TokensLeftInputSchema.parse(input);
  // tokensLeft = floor(remainingCents / (centsPer1kTokens / 1000))
  // = floor(remainingCents * 1000 / centsPer1kTokens)
  return Math.floor((parsed.remainingCents * 1000) / parsed.centsPer1kTokens);
}

