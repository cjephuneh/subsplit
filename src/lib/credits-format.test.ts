import { describe, expect, it } from "vitest";

import {
  formatCreditsFromCents,
  formatSignedCreditsFromCents,
} from "@/lib/credits-format";

describe("formatCreditsFromCents", () => {
  it("Happy Path: formats with 2 decimals", () => {
    expect(formatCreditsFromCents(12345)).toBe("123.45 credits");
  });

  it("Edge Case: formats zero", () => {
    expect(formatCreditsFromCents(0)).toBe("0.00 credits");
  });

  it("Failure Case: handles NaN as string", () => {
    expect(formatCreditsFromCents(Number.NaN)).toBe("NaN credits");
  });
});

describe("formatSignedCreditsFromCents", () => {
  it("Happy Path: formats positive with plus", () => {
    expect(formatSignedCreditsFromCents(250)).toBe("+2.50");
  });

  it("Edge Case: formats negative with minus symbol", () => {
    expect(formatSignedCreditsFromCents(-250)).toBe("−2.50");
  });

  it("Failure Case: handles Infinity", () => {
    expect(formatSignedCreditsFromCents(Number.POSITIVE_INFINITY)).toBe(
      "+Infinity",
    );
  });
});

