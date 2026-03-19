import { describe, expect, it } from "vitest";

import { ApiKeyEnvironmentSchema } from "@/server/api-keys";

describe("ApiKeyEnvironmentSchema", () => {
  it("Happy Path: parses PRODUCTION", () => {
    expect(ApiKeyEnvironmentSchema.parse("PRODUCTION")).toBe("PRODUCTION");
  });

  it("Edge Case: parses SANDBOX", () => {
    expect(ApiKeyEnvironmentSchema.parse("SANDBOX")).toBe("SANDBOX");
  });

  it("Failure Case: rejects unknown value", () => {
    expect(() => ApiKeyEnvironmentSchema.parse("LIVE")).toThrow();
  });
});

