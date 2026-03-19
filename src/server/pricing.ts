export function costCentsForTokens(input: { tokens: number; centsPer1k: number }) {
  // Charge by rounding up to avoid undercharging small requests.
  return Math.ceil((input.tokens / 1000) * input.centsPer1k);
}

