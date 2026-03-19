import { describe, expect, it } from "vitest";

import { costCentsForTokens } from "@/server/pricing";

describe("costCentsForTokens", () => {
  it("Happy Path: charges proportionally with ceil", () => {
    expect(costCentsForTokens({ tokens: 1000, centsPer1k: 120 })).toBe(120);
  });

  it("Edge Case: rounds up small token counts", () => {
    expect(costCentsForTokens({ tokens: 1, centsPer1k: 120 })).toBe(1);
  });

  it("Failure Case: handles zero tokens as zero", () => {
    expect(costCentsForTokens({ tokens: 0, centsPer1k: 120 })).toBe(0);
  });
});

