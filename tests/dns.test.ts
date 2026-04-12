import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { CONFIG } from "../src/config";
import {
  cleanupDnsLaunchConfig,
  createDnsLaunchConfig,
  resolveViaConfiguredDns,
  verifyConfiguredDnsProfile,
} from "../src/lib/dns";
import {
  emitDnsDiagnosticLog,
  type DnsDiagnosticLogParams,
} from "../src/lib/screenshot";

vi.mock("puppeteer", () => ({ default: {} }));
vi.mock("sharp", () => ({ default: () => ({}) }));

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

  it("skips JSON preflight when checkDnsStatus is false", async () => {
    const dns = CONFIG.screenshot.dns as typeof CONFIG.screenshot.dns & {
      checkDnsStatus: boolean;
    };
    const prev = dns.checkDnsStatus;
    dns.checkDnsStatus = false;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    try {
      const resolved = await resolveViaConfiguredDns("example.com");
      expect(resolved).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      dns.checkDnsStatus = prev;
    }
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

const makeVerification = (
  overrides: Partial<DnsDiagnosticLogParams["verification"]>,
): DnsDiagnosticLogParams["verification"] => ({
  matches: true,
  reason: "profile-match",
  profile: "364ec7",
  expectedProfileId: "364ec7",
  protocol: "DOH",
  statusValue: "ok",
  ...overrides,
});

const baseParams = (
  verificationOverrides: Partial<DnsDiagnosticLogParams["verification"]> = {},
): DnsDiagnosticLogParams => ({
  hostname: "example.com",
  dnsEnabled: true,
  dnsProviderAvailable: true,
  verification: makeVerification(verificationOverrides),
  verificationEndpoint: "https://test.nextdns.io",
  enforceProfileMatch: false,
});

describe("emitDnsDiagnosticLog", () => {
  const dnsMutable = CONFIG.screenshot.dns as typeof CONFIG.screenshot.dns & {
    verboseLogging: boolean;
  };
  let verbosePrev: boolean;

  beforeEach(() => {
    verbosePrev = dnsMutable.verboseLogging;
    dnsMutable.verboseLogging = true;
  });

  afterEach(() => {
    dnsMutable.verboseLogging = verbosePrev;
  });

  it("calls console.warn when matches is false (doh-inactive)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    emitDnsDiagnosticLog(
      baseParams({
        matches: false,
        reason: "doh-inactive",
        statusValue: "unconfigured",
        protocol: "DNS",
        profile: null,
      }),
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).not.toHaveBeenCalled();

    const [label, entry] = warnSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(label).toContain("NextDNS");
    expect(entry.hostname).toBe("example.com");
    expect(entry.matches).toBe(false);
    expect(entry.reason).toBe("doh-inactive");
    expect(entry.statusValue).toBe("unconfigured");
    expect(entry.protocol).toBe("DNS");
  });

  it("calls console.warn when matches is false (profile-mismatch)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    emitDnsDiagnosticLog(
      baseParams({
        matches: false,
        reason: "profile-mismatch",
        statusValue: "ok",
        protocol: "DOH",
        profile: "other-profile",
        expectedProfileId: "364ec7",
      }),
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [, entry] = warnSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(entry.matches).toBe(false);
    expect(entry.reason).toBe("profile-mismatch");
    expect(entry.profile).toBe("other-profile");
    expect(entry.expectedProfileId).toBe("364ec7");
  });

  it("calls console.info when matches is null (unreachable)", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    emitDnsDiagnosticLog(
      baseParams({
        matches: null,
        reason: "unreachable",
        statusValue: null,
        protocol: null,
        profile: null,
      }),
    );

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();

    const [label, entry] = infoSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(label).toContain("NextDNS");
    expect(entry.hostname).toBe("example.com");
    expect(entry.matches).toBeNull();
    expect(entry.reason).toBe("unreachable");
  });

  it("calls console.info when matches is true (success)", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    emitDnsDiagnosticLog(baseParams());

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();

    const [, entry] = infoSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(entry.matches).toBe(true);
    expect(entry.reason).toBe("profile-match");
    expect(entry.statusValue).toBe("ok");
    expect(entry.protocol).toBe("DOH");
  });

  it("includes all required structured fields in the log entry", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    emitDnsDiagnosticLog({
      hostname: "superadblocktest.com",
      dnsEnabled: true,
      dnsProviderAvailable: false,
      verification: makeVerification({
        matches: true,
        reason: "profile-match",
        profile: "364ec7",
        expectedProfileId: "364ec7",
        protocol: "DOH",
        statusValue: "ok",
      }),
      verificationEndpoint: "https://test.nextdns.io",
      enforceProfileMatch: false,
    });

    const [, entry] = infoSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(entry).toMatchObject({
      hostname: "superadblocktest.com",
      dnsEnabled: true,
      dnsProviderAvailable: false,
      matches: true,
      reason: "profile-match",
      statusValue: "ok",
      protocol: "DOH",
      profile: "364ec7",
      expectedProfileId: "364ec7",
      verificationEndpoint: "https://test.nextdns.io",
      enforceProfileMatch: false,
    });
  });
});
