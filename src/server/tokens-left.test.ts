import { describe, expect, it } from "vitest";

import { estimateTokensLeft } from "@/server/tokens-left";

describe("estimateTokensLeft", () => {
  it("happy path", () => {
    expect(estimateTokensLeft({ remainingCents: 260, centsPer1kTokens: 260 })).toBe(1000);
  });

  it("edge case: floors", () => {
    expect(estimateTokensLeft({ remainingCents: 259, centsPer1kTokens: 260 })).toBe(996);
  });

  it("failure case: negative remaining", () => {
    expect(() => estimateTokensLeft({ remainingCents: -1, centsPer1kTokens: 260 })).toThrow();
  });
});

