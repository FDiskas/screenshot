import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { cacheService, isExpired, parseScreenshotMeta } from "../src/lib/cache";
import { CONFIG } from "../src/config";
import { checkSafety } from "../src/lib/safety";

// Mock fetch globally using spyOn
const fetchSpy = spyOn(globalThis, "fetch");

afterEach(() => {
  fetchSpy.mockClear(); // Reset call history
});

describe("Safety Check", () => {
  it("should return true if status is false (safe)", async () => {
    fetchSpy.mockResolvedValue(
      Response.json({ url: "google.com", status: false }),
    );

    const isSafe = await checkSafety("https://google.com");
    expect(isSafe).toBe(true);
  });

  it("should return false if status is true (unsafe)", async () => {
    fetchSpy.mockResolvedValue(
      Response.json({ url: "malware.com", status: true }),
    );

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
    const path = cacheService.getPath(
      "example.com",
      new Date("2026-04-07T00:00:00Z"),
      1920,
      1080,
    );
    expect(path).toContain("example.com");
    expect(path).toMatch(/-1920x1080\.png$/);
  });

  it("should be deterministic", () => {
    const date = new Date();
    const path1 = cacheService.getPath("google.com", date, 1280, 720);
    const path2 = cacheService.getPath("google.com", date, 1280, 720);
    expect(path1).toBe(path2);
  });
});

describe("Metadata Parsing", () => {
  it("should parse valid screenshot filename", () => {
    const filename = "20260407T000000Z-abcdef12-1920x1080.png";
    const meta = parseScreenshotMeta(filename);
    expect(meta).toBeDefined();
    expect(meta?.createdAt.toISOString()).toBe("2026-04-07T00:00:00.000Z");
    expect(meta?.width).toBe(1920);
    expect(meta?.height).toBe(1080);
  });

  it("should return undefined for invalid filename format", () => {
    expect(parseScreenshotMeta("invalid.png")).toBeUndefined();
    expect(parseScreenshotMeta("2026-04-07-abcd.png")).toBeUndefined();
  });
});

describe("Expiration Logic", () => {
  it("should not be expired if within maxAgeMs", () => {
    const now = new Date();
    expect(isExpired(now)).toBe(false);
  });

  it("should be expired if older than maxAgeMs", () => {
    const oldDate = new Date(Date.now() - CONFIG.cache.maxAgeMs - 1000);
    expect(isExpired(oldDate)).toBe(true);
  });
});
