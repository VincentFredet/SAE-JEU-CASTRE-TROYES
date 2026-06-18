import { describe, expect, it } from "vitest";
import { sanitizeRichText } from "./rich-text";

describe("sanitizeRichText", () => {
  it("keeps allowed formatting tags", () => {
    const html = "<p>Bonjour <strong>monde</strong> et <em>la suite</em></p>";
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("strips script blocks with their content", () => {
    const out = sanitizeRichText("<p>ok</p><script>alert(1)</script>");
    expect(out).toBe("<p>ok</p>");
  });

  it("drops attributes from formatting tags", () => {
    const out = sanitizeRichText('<p class="x" onclick="evil()">hi</p>');
    expect(out).toBe("<p>hi</p>");
  });

  it("removes unknown tags but keeps their text", () => {
    expect(sanitizeRichText("<div><p>texte</p></div>")).toBe("<p>texte</p>");
  });

  it("keeps safe links and forces rel/target", () => {
    const out = sanitizeRichText('<a href="https://example.com">lien</a>');
    expect(out).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">lien</a>',
    );
  });

  it("drops javascript: hrefs", () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">x</a>');
    expect(out).toBe("<a>x</a>");
  });

  it("drops protocol-relative hrefs but keeps relative paths", () => {
    expect(sanitizeRichText('<a href="//evil.com">x</a>')).toBe("<a>x</a>");
    expect(sanitizeRichText('<a href="/shop">x</a>')).toBe(
      '<a href="/shop" target="_blank" rel="noopener noreferrer nofollow">x</a>',
    );
  });

  it("collapses empty editor paragraphs", () => {
    expect(sanitizeRichText("<p>un</p><p><br></p><p>deux</p>")).toBe("<p>un</p><p>deux</p>");
  });

  it("returns an empty string for nullish input", () => {
    expect(sanitizeRichText(null)).toBe("");
    expect(sanitizeRichText(undefined)).toBe("");
  });
});
