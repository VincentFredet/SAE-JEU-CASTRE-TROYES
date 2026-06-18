import { describe, expect, it } from "vitest";
import { isValidGuestName } from "./guest";

describe("isValidGuestName", () => {
  it("accepts plain nicknames", () => {
    expect(isValidGuestName("Alice")).toBe(true);
    expect(isValidGuestName("jean-luc")).toBe(true);
    expect(isValidGuestName("Zoé 42")).toBe(true);
    expect(isValidGuestName("O'Connor")).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    expect(isValidGuestName("  Bob  ")).toBe(true);
  });

  it("rejects too short or too long", () => {
    expect(isValidGuestName("a")).toBe(false);
    expect(isValidGuestName("x".repeat(21))).toBe(false);
  });

  it("rejects markup and control characters", () => {
    expect(isValidGuestName("<script>")).toBe(false);
    expect(isValidGuestName("bad/name")).toBe(false);
    expect(isValidGuestName("a\tb")).toBe(false);
  });
});
