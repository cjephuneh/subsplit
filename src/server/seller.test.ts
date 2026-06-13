import { describe, expect, it } from "vitest";
import { getListedKeyProvider, calculateSellerPayout } from "@/server/seller";

describe("seller helpers", () => {
  describe("getListedKeyProvider", () => {
    it("Happy Path: normalizes openai and azure providers", () => {
      expect(getListedKeyProvider("OpenAI")).toBe("openai");
      expect(getListedKeyProvider("Azure OpenAI")).toBe("openai");
    });

    it("Happy Path: normalizes anthropic and claude providers", () => {
      expect(getListedKeyProvider("Anthropic")).toBe("anthropic");
      expect(getListedKeyProvider("Claude")).toBe("anthropic");
    });

    it("Happy Path: normalizes groq and xai/grok providers", () => {
      expect(getListedKeyProvider("Groq")).toBe("groq");
      expect(getListedKeyProvider("xAI")).toBe("grok");
      expect(getListedKeyProvider("Grok")).toBe("grok");
    });

    it("Edge Case: returns lowercase version for unknown providers", () => {
      expect(getListedKeyProvider("CoHere")).toBe("cohere");
    });
  });

  describe("calculateSellerPayout", () => {
    it("Happy Path: calculates exactly 85% of cost", () => {
      expect(calculateSellerPayout(100)).toBe(85);
      expect(calculateSellerPayout(200)).toBe(170);
    });

    it("Edge Case: uses floor rounding on decimal cents", () => {
      expect(calculateSellerPayout(1)).toBe(0); // 0.85 -> 0
      expect(calculateSellerPayout(5)).toBe(4); // 4.25 -> 4
      expect(calculateSellerPayout(10)).toBe(8); // 8.5 -> 8
    });
  });
});
