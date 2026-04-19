import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { cacheService } from "../src/lib/cache";
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
      1080
    );
    expect(path).toContain("example.com");
    expect(path).toMatch(/-1920x1080\.png$/);
  });
});
