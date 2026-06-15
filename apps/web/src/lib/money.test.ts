import { describe, expect, it } from "vitest";
import { formatPrice } from "./money";

function digitsAndSeparators(value: string): string {
  return value.replace(/[^0-9.,]/g, "");
}

describe("formatPrice", () => {
  it("converts cents to units (divides by 100)", () => {
    expect(digitsAndSeparators(formatPrice(3990, "EUR", "fr"))).toBe("39,90");
    expect(digitsAndSeparators(formatPrice(3990, "EUR", "en"))).toBe("39.90");
  });

  it("formats EUR in French with a comma decimal separator and euro sign", () => {
    const out = formatPrice(3990, "EUR", "fr");
    expect(out).toContain("39,90");
    expect(out).toContain("€");
    expect(out).not.toContain("39.90");
  });

  it("formats EUR in English with a dot decimal separator and a leading euro sign", () => {
    const out = formatPrice(3990, "EUR", "en");
    expect(out).toContain("€");
    expect(out).toContain("39.90");
    expect(out.indexOf("€")).toBeLessThan(out.indexOf("39"));
  });

  it("formats a zero amount with two decimals", () => {
    expect(digitsAndSeparators(formatPrice(0, "EUR", "fr"))).toBe("0,00");
    expect(digitsAndSeparators(formatPrice(0, "EUR", "en"))).toBe("0.00");
  });

  it("keeps the right order of magnitude for large amounts", () => {
    const fr = formatPrice(1234567, "EUR", "fr");
    const en = formatPrice(1234567, "EUR", "en");
    expect(fr).toContain("345");
    expect(fr).toContain(",67");
    expect(en).toContain("12,345.67");
  });

  it("does not crash and renders a non-EUR currency", () => {
    const usd = formatPrice(3990, "USD", "fr");
    const gbp = formatPrice(1500, "GBP", "en");
    expect(usd).toContain("39,90");
    expect(gbp).toContain("£");
    expect(gbp).toContain("15.00");
  });
});
