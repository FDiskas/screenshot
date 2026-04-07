import { describe, it, expect, vi } from "vitest";
import { checkSafety } from "../src/lib/safety";
import { cacheService } from "../src/lib/cache";

// Mock fetch for safety check
global.fetch = vi.fn() as unknown as typeof fetch;

describe("Safety Check", () => {
  it("should return true if status is false (safe)", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "google.com", status: false }),
    });

    const isSafe = await checkSafety("https://google.com");
    expect(isSafe).toBe(true);
  });

  it("should return false if status is true (unsafe)", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "malware.com", status: true }),
    });

    const isSafe = await checkSafety("https://malware.com");
    expect(isSafe).toBe(false);
  });
});

describe("Cache Service", () => {
  it("should extract domain correctly", () => {
    expect(cacheService.getDomain("https://google.com/search?q=test")).toBe(
      "google.com",
    );
    expect(cacheService.getDomain("https://sub.domain.co.uk/page")).toBe(
      "sub.domain.co.uk",
    );
  });

  it("should generate correct relative path", () => {
    const url = "https://example.com";
    const path = cacheService.getPath(
      "example.com",
      new Date("2026-04-07T00:00:00Z"),
    );
    expect(path).toContain("example.com");
    expect(path).toMatch(/\.png$/);
  });
});
