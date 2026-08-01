import { describe, it, expect } from "vitest";
import { sanitizeHtml, stripHtml, sanitizeMarkdown } from "../sanitizer";

describe("Security Sanitizer Utility", () => {
  it("strips script tags and inline handlers from HTML", () => {
    const malicious = '<script>alert("xss")</script><img src="x" onerror="alert(1)" />Hello';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("onerror");
    expect(clean).toContain("Hello");
  });

  it("strips javascript: protocol URIs", () => {
    const malicious = '<a href="javascript:alert(1)">Click me</a>';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain("javascript:");
  });

  it("strips iframe and object tags", () => {
    const malicious = '<iframe src="https://evil.com"></iframe><object data="evil.swf"></object>';
    const clean = sanitizeHtml(malicious);
    expect(clean).not.toContain("<iframe");
    expect(clean).not.toContain("<object");
  });

  it("strips all HTML tags in stripHtml", () => {
    const html = "<p><strong>Bold</strong> <em>Text</em></p>";
    expect(stripHtml(html)).toBe("Bold Text");
  });

  it("handles null and undefined gracefully", () => {
    expect(sanitizeHtml(null)).toBe("");
    expect(stripHtml(undefined)).toBe("");
    expect(sanitizeMarkdown("")).toBe("");
  });
});
