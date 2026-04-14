import { describe, expect, it } from "vitest";
import { CONFIG } from "../src/config";
import {
  isValidScreenshotUrl,
  parseScreenshotParams,
  resolveScreenshotDomain,
} from "../src/lib/request";

describe("parseScreenshotParams", () => {
  it("returns null when url is undefined", () => {
    expect(parseScreenshotParams(undefined, undefined, undefined)).toBeNull();
  });

  it("returns null when url is empty string", () => {
    expect(parseScreenshotParams("", undefined, undefined)).toBeNull();
  });

  it("upgrades http:// to https://", () => {
    const result = parseScreenshotParams(
      "http://example.com",
      undefined,
      undefined,
    );
    expect(result).not.toBeNull();
    expect(result?.url).toBe("https://example.com");
  });

  it("keeps https:// URLs unchanged", () => {
    const result = parseScreenshotParams(
      "https://example.com",
      undefined,
      undefined,
    );
    expect(result?.url).toBe("https://example.com");
  });

  it("passes through non-http URLs unchanged", () => {
    const result = parseScreenshotParams(
      "ftp://example.com",
      undefined,
      undefined,
    );
    expect(result?.url).toBe("ftp://example.com");
  });

  it("uses default width and height when not provided", () => {
    const result = parseScreenshotParams(
      "https://example.com",
      undefined,
      undefined,
    );
    expect(result?.width).toBe(CONFIG.screenshot.defaultWidth);
    expect(result?.height).toBe(CONFIG.screenshot.defaultHeight);
  });

  it("parses custom width and height", () => {
    const result = parseScreenshotParams("https://example.com", "1024", "768");
    expect(result?.width).toBe(1024);
    expect(result?.height).toBe(768);
  });

  it("falls back to defaults for non-numeric width/height", () => {
    const result = parseScreenshotParams("https://example.com", "abc", "");
    expect(result?.width).toBeNaN();
    expect(result?.height).toBe(CONFIG.screenshot.defaultHeight);
  });
});

describe("isValidScreenshotUrl", () => {
  it("accepts https:// URLs", () => {
    expect(isValidScreenshotUrl("https://example.com")).toBe(true);
  });

  it("rejects http:// URLs", () => {
    expect(isValidScreenshotUrl("http://example.com")).toBe(false);
  });

  it("rejects URLs without protocol", () => {
    expect(isValidScreenshotUrl("example.com")).toBe(false);
  });

  it("rejects ftp:// URLs", () => {
    expect(isValidScreenshotUrl("ftp://example.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidScreenshotUrl("")).toBe(false);
  });
});

describe("resolveScreenshotDomain", () => {
  it("resolves domain and domainUrl from a valid URL", () => {
    const result = resolveScreenshotDomain("https://www.Example.COM/path?q=1");
    expect(result).not.toBeNull();
    expect(result?.domain).toBe("www.example.com");
    expect(result?.domainUrl).toBe("https://www.example.com");
  });

  it("strips path, query and hash", () => {
    const result = resolveScreenshotDomain("https://test.io/page?a=1#top");
    expect(result?.domainUrl).toBe("https://test.io");
  });

  it("lowercases the hostname", () => {
    const result = resolveScreenshotDomain("https://ExAmPlE.CoM");
    expect(result?.domain).toBe("example.com");
  });

  it("returns null for an invalid URL", () => {
    expect(resolveScreenshotDomain("not-a-url")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(resolveScreenshotDomain("")).toBeNull();
  });
});
