import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatRelativeDate, getAvatarUrl, sanitizeExternalUrl, generateIcs } from "@/lib/utils";

describe("Utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("formatRelativeDate", () => {
    it("formats dates less than 24 hours ago relatively", () => {
      const now = new Date();
      vi.setSystemTime(now);
      
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeDate(twoHoursAgo)).toMatch(/about 2 hours ago/);
    });

    it("formats dates more than 24 hours ago absolutely", () => {
      const now = new Date("2023-10-15T12:00:00Z");
      vi.setSystemTime(now);
      
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      expect(formatRelativeDate(twoDaysAgo)).toBe("Oct 13, 2023");
    });
  });

  describe("getAvatarUrl", () => {
    it("returns undefined for missing url", () => {
      expect(getAvatarUrl(null)).toBeUndefined();
      expect(getAvatarUrl(undefined)).toBeUndefined();
    });

    it("returns absolute URLs directly", () => {
      expect(getAvatarUrl("https://example.com/avatar.jpg")).toBe("https://example.com/avatar.jpg");
      expect(getAvatarUrl("http://example.com/avatar.jpg")).toBe("http://example.com/avatar.jpg");
      expect(getAvatarUrl("data:image/png;base64,123")).toBe("data:image/png;base64,123");
    });

    it("proxies avatars/ prefixed URLs", () => {
      expect(getAvatarUrl("avatars/user-123.jpg")).toBe("/api/avatar?pathname=avatars%2Fuser-123.jpg");
    });

    it("returns other URLs as is", () => {
      expect(getAvatarUrl("/some/other/path.jpg")).toBe("/some/other/path.jpg");
    });
  });

  describe("sanitizeExternalUrl", () => {
    it("returns null for invalid inputs", () => {
      expect(sanitizeExternalUrl(null)).toBeNull();
      expect(sanitizeExternalUrl(undefined)).toBeNull();
      expect(sanitizeExternalUrl("")).toBeNull();
    });

    it("keeps http and https URLs", () => {
      expect(sanitizeExternalUrl("https://example.com")).toBe("https://example.com");
      expect(sanitizeExternalUrl("http://example.com")).toBe("http://example.com");
    });

    it("adds https to www. URLs", () => {
      expect(sanitizeExternalUrl("www.example.com")).toBe("https://www.example.com");
    });

    it("returns null for unrecognized formats", () => {
      expect(sanitizeExternalUrl("example.com")).toBeNull();
      expect(sanitizeExternalUrl("javascript:alert(1)")).toBeNull();
    });
  });

  describe("generateIcs", () => {
    it("creates a blob and triggers a download (jsdom environment required for full test)", () => {
      // document and window need to be mocked or we need jsdom
      // For now just checking it doesn't throw if document exists
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const createObjectURLMock = vi.fn().mockReturnValue("blob:test");
        window.URL.createObjectURL = createObjectURLMock;
        
        const createElementMock = vi.spyOn(document, "createElement");
        const appendChildMock = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
        const removeChildMock = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
        
        generateIcs("Test Event", "Description", new Date("2023-10-15T12:00:00Z"), new Date("2023-10-15T13:00:00Z"));
        
        expect(createElementMock).toHaveBeenCalledWith("a");
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(appendChildMock).toHaveBeenCalled();
        expect(removeChildMock).toHaveBeenCalled();
      }
    });
  });
});
