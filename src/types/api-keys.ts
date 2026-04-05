/** Enriched row for dashboard + GET /api/keys/list */
export type EnrichedApiKey = {
  id: string;
  label: string;
  environment: string;
  prefix: string;
  quotaCents: number;
  usedCents: number;
  remainingCents: number;
  tokensLeft: number | null;
  defaultModelKey: string | null;
  lastUsedAt: string | Date | null;
  revokedAt: string | Date | null;
  createdAt: string | Date;
};
