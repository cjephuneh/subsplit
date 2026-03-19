import { describe, expect, it } from "vitest";

import { normalizePhoneNumber, PhoneNumberSchema } from "@/server/mpesa";

describe("normalizePhoneNumber", () => {
  it("Happy Path: keeps 2547XXXXXXXX", () => {
    expect(normalizePhoneNumber("254712345678")).toBe("254712345678");
  });

  it("Edge Case: converts 07XXXXXXXX to 2547XXXXXXXX", () => {
    expect(normalizePhoneNumber("0712345678")).toBe("254712345678");
  });

  it("Edge Case: converts +2547XXXXXXXX", () => {
    expect(normalizePhoneNumber("+254712345678")).toBe("254712345678");
  });

  it("Failure Case: leaves unknown formats unchanged", () => {
    expect(normalizePhoneNumber("123")).toBe("123");
  });
});

describe("PhoneNumberSchema", () => {
  it("Happy Path: parses 0712345678 by normalizing", () => {
    expect(PhoneNumberSchema.parse("0712345678")).toBe("254712345678");
  });

  it("Failure Case: rejects non-mobile numbers", () => {
    expect(() => PhoneNumberSchema.parse("254112345678")).toThrow();
  });
});

