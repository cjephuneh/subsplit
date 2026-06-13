/**
 * Normalizes model provider names into standard marketplace key providers.
 */
export function getListedKeyProvider(modelProvider: string): string {
  const p = modelProvider.toLowerCase();
  if (p.includes("openai") || p.includes("azure")) return "openai";
  if (p.includes("anthropic") || p.includes("claude")) return "anthropic";
  if (p.includes("groq")) return "groq";
  if (p.includes("xai") || p.includes("grok")) return "grok";
  return p;
}

/**
 * Calculates the seller payout based on an 85% revenue share.
 */
export function calculateSellerPayout(costCents: number): number {
  return Math.floor(costCents * 0.85);
}
