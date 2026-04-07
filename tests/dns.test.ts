import { afterEach, describe, expect, it, vi } from "vitest";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  cleanupDnsLaunchConfig,
  createDnsLaunchConfig,
  resolveViaConfiguredDns,
  verifyConfiguredDnsProfile,
} from "../src/lib/dns";

class MockResponse {
  constructor(
    private readonly body: string,
    private readonly responseStatus = 200,
  ) {}

  status() {
    return this.responseStatus;
  }

  async text() {
    return this.body;
  }
}

class MockPage {
  private responses: Array<MockResponse | Error>;

  constructor(responses: Array<MockResponse | Error>) {
    this.responses = [...responses];
  }

  async goto(_url: string) {
    const next = this.responses.shift();
    if (!next) {
      throw new Error("No mock response queued");
    }
    if (next instanceof Error) {
      throw next;
    }
    return next;
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DNS preflight", () => {
  it("returns true when A lookup resolves", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: 0, Answer: [{ data: "1.1.1.1" }] }),
    } as any) as unknown as typeof fetch;

    const resolved = await resolveViaConfiguredDns("example.com");
    expect(resolved).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to AAAA when A lookup does not resolve", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ Status: 0, Answer: [] }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ Status: 0, Answer: [{ data: "::1" }] }),
      } as any) as unknown as typeof fetch;

    const resolved = await resolveViaConfiguredDns("example.com");
    expect(resolved).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("returns false when fetch throws", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const resolved = await resolveViaConfiguredDns("example.com");
    expect(resolved).toBe(false);
  });
});

describe("DNS verification", () => {
  it("returns true for ok/DOH with matching profile", async () => {
    const page = new MockPage([
      new MockResponse(
        JSON.stringify({
          status: "ok",
          protocol: "DOH",
          profile: "364ec7",
        }),
      ),
    ]);

    const matches = await verifyConfiguredDnsProfile(page as any);
    expect(matches).toBe(true);
  });

  it("parses nested NextDNS diagnostics URL and validates profile", async () => {
    const page = new MockPage([
      new MockResponse(
        '<script>xhr.open("GET","https://abc123.test.nextdns.io/",false)</script>',
        200,
      ),
      new MockResponse(
        JSON.stringify({
          status: "ok",
          protocol: "DOH",
          profile: "364ec7",
        }),
      ),
    ]);

    const matches = await verifyConfiguredDnsProfile(page as any);
    expect(matches).toBe(true);
  });

  it("returns false for unconfigured status", async () => {
    const page = new MockPage([
      new MockResponse(
        JSON.stringify({
          status: "unconfigured",
          resolver: "1.1.1.1",
        }),
      ),
    ]);

    const matches = await verifyConfiguredDnsProfile(page as any);
    expect(matches).toBe(false);
  });

  it("returns null when verification endpoint errors", async () => {
    const page = new MockPage([new Error("timeout")]);

    const matches = await verifyConfiguredDnsProfile(page as any);
    expect(matches).toBeNull();
  });
});

describe("DNS launch config", () => {
  it("creates user data dir with secure DNS Local State", async () => {
    const result = await createDnsLaunchConfig(["--no-sandbox"]);

    expect(result.launchArgs).toContain("--no-sandbox");
    expect(result.launchArgs).toContain("--enable-features=AsyncDns");
    expect(result.userDataDir).toBeTruthy();

    const localStatePath = join(result.userDataDir as string, "Local State");
    await access(localStatePath);
    const localStateText = await readFile(localStatePath, "utf8");
    const localState = JSON.parse(localStateText) as {
      dns_over_https: { mode: string; templates: string };
      async_dns: { enabled: boolean };
    };

    expect(localState.dns_over_https.mode).toBe("secure");
    expect(localState.async_dns.enabled).toBe(true);

    await cleanupDnsLaunchConfig(result.userDataDir);
  });
});
