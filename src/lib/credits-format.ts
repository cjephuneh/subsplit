export function formatCreditsFromCents(cents: number) {
  const credits = cents / 100;
  return `${credits.toFixed(2)} credits`;
}

export function formatSignedCreditsFromCents(cents: number) {
  const sign = cents >= 0 ? "+" : "−";
  const abs = Math.abs(cents);
  return `${sign}${(abs / 100).toFixed(2)}`;
}

