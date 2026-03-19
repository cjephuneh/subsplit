import { describe, expect, it } from "vitest";

import { costCentsForTokens } from "@/server/pricing";

describe("costCentsForTokens", () => {
  it("Happy Path: charges proportionally with ceil", () => {
    expect(costCentsForTokens({ promptTokens: 500, completionTokens: 500, inputCentsPer1k: 50, outputCentsPer1k: 100 })).toBe(25 + 50);
  });

  it("Edge Case: rounds up small token counts", () => {
    expect(costCentsForTokens({ promptTokens: 1, completionTokens: 1, inputCentsPer1k: 120, outputCentsPer1k: 120 })).toBe(2);
  });

  it("Failure Case: handles zero tokens as zero", () => {
    expect(costCentsForTokens({ promptTokens: 0, completionTokens: 0, inputCentsPer1k: 120, outputCentsPer1k: 120 })).toBe(0);
  });
});

