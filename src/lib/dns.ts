import type { Page } from "puppeteer";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONFIG } from "../config";

const hasDnsAnswer = async (
  hostname: string,
  recordType: "A" | "AAAA",
): Promise<boolean> => {
  const dnsUrl = `${CONFIG.screenshot.dns.preflightJsonEndpoint}?name=${encodeURIComponent(hostname)}&type=${recordType}`;
  const timeoutSignal = AbortSignal.timeout(
    CONFIG.screenshot.dns.preflightLookupTimeoutMs,
  );
  const response = await fetch(dnsUrl, {
    headers: {
      accept: "application/dns-json",
    },
    signal: timeoutSignal,
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as {
    Status?: number;
    Answer?: Array<{ data?: string }>;
  };
  return (
    data.Status === 0 &&
    Array.isArray(data.Answer) &&
    data.Answer.some((answer) => !!answer?.data)
  );
};

export const resolveViaConfiguredDns = async (
  hostname: string,
): Promise<boolean> => {
  if (!CONFIG.screenshot.dns.enabled) {
    return false;
  }
  if (!CONFIG.screenshot.dns.checkDnsStatus) {
    return true;
  }

  try {
    // Some hosts may be IPv6-only, so probe both A and AAAA.
    if (await hasDnsAnswer(hostname, "A")) {
      return true;
    }
    return await hasDnsAnswer(hostname, "AAAA");
  } catch {
    return false;
  }
};

interface DnsVerificationDebug {
  profile: string | null;
  protocol: string | null;
  statusValue: string | null;
  error?: string;
}

export type DnsVerificationReason =
  | "unreachable"
  | "doh-inactive"
  | "profile-match"
  | "profile-mismatch"
  | "profile-not-available";

export interface DnsProfileVerificationResult {
  matches: boolean | null;
  reason: DnsVerificationReason;
  profile: string | null;
  expectedProfileId: string | null;
  protocol: string | null;
  statusValue: string | null;
}

const nonEmptyStringOrNull = (value: unknown): string | null => {
  return typeof value === "string" && value.length > 0 ? value : null;
};

const parseVerificationPayload = (
  payload: string,
): {
  profile: string | null;
  protocol: string | null;
  statusValue: string | null;
} => {
  try {
    const data = JSON.parse(payload) as {
      profile?: string;
      protocol?: string;
      status?: string;
    };
    const profile = nonEmptyStringOrNull(data?.profile);
    const protocol = nonEmptyStringOrNull(data?.protocol);
    const statusValue = nonEmptyStringOrNull(data?.status);
    return { profile, protocol, statusValue };
  } catch {
    return { profile: null, protocol: null, statusValue: null };
  }
};

const extractNestedNextDnsUrl = (payload: string): string | null => {
  const match = payload.match(/https:\/\/[a-z0-9-]+\.test\.nextdns\.io\/?/i);
  return match?.[0] ?? null;
};

const fetchDnsVerificationDebug = async (
  page: Page,
): Promise<DnsVerificationDebug> => {
  const readResponse = async (
    targetUrl: string,
  ): Promise<{
    payload: string | null;
    error?: string;
  }> => {
    try {
      const response = await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: CONFIG.screenshot.dns.preflightLookupTimeoutMs,
      });

      if (!response) {
        return {
          payload: null,
          error: "No response",
        };
      }

      const payload = await response.text();
      return {
        payload,
      };
    } catch (error: unknown) {
      return {
        payload: null,
        error:
          error instanceof Error
            ? error.message
            : "Unknown DNS verification error",
      };
    }
  };

  const primary = await readResponse(
    CONFIG.screenshot.dns.verificationEndpoint,
  );
  if (!primary.payload) {
    return {
      profile: null,
      protocol: null,
      statusValue: null,
      error: primary.error,
    };
  }

  const primaryParsed = parseVerificationPayload(primary.payload);
  if (
    primaryParsed.profile ||
    primaryParsed.protocol ||
    primaryParsed.statusValue
  ) {
    return {
      profile: primaryParsed.profile,
      protocol: primaryParsed.protocol,
      statusValue: primaryParsed.statusValue,
    };
  }

  const nestedUrl = extractNestedNextDnsUrl(primary.payload);
  if (!nestedUrl) {
    return {
      profile: null,
      protocol: null,
      statusValue: null,
    };
  }

  const nested = await readResponse(nestedUrl);
  const nestedParsed = nested.payload
    ? parseVerificationPayload(nested.payload)
    : { profile: null, protocol: null, statusValue: null };
  return {
    profile: nestedParsed.profile,
    protocol: nestedParsed.protocol,
    statusValue: nestedParsed.statusValue,
    error: nested.error,
  };
};

export const verifyConfiguredDnsProfile = async (
  page: Page,
): Promise<boolean | null> => {
  const result = await verifyConfiguredDnsProfileDetailed(page);
  return result.matches;
};

export const verifyConfiguredDnsProfileDetailed = async (
  page: Page,
): Promise<DnsProfileVerificationResult> => {
  const verification = await fetchDnsVerificationDebug(page);
  if (verification.statusValue === null && verification.error) {
    return {
      matches: null,
      reason: "unreachable",
      profile: verification.profile,
      expectedProfileId: CONFIG.screenshot.dns.expectedProfileId ?? null,
      protocol: verification.protocol,
      statusValue: verification.statusValue,
    };
  }

  // Treat successful DoH status as the primary signal that browser DNS is configured.
  const isDohActive =
    verification.statusValue?.toLowerCase() === "ok" &&
    verification.protocol?.toUpperCase() === "DOH";

  if (!isDohActive) {
    return {
      matches: false,
      reason: "doh-inactive",
      profile: verification.profile,
      expectedProfileId: CONFIG.screenshot.dns.expectedProfileId ?? null,
      protocol: verification.protocol,
      statusValue: verification.statusValue,
    };
  }

  if (!CONFIG.screenshot.dns.expectedProfileId) {
    return {
      matches: true,
      reason: "profile-not-available",
      profile: verification.profile,
      expectedProfileId: null,
      protocol: verification.protocol,
      statusValue: verification.statusValue,
    };
  }

  if (!verification.profile) {
    return {
      matches: true,
      reason: "profile-not-available",
      profile: verification.profile,
      expectedProfileId: CONFIG.screenshot.dns.expectedProfileId,
      protocol: verification.protocol,
      statusValue: verification.statusValue,
    };
  }

  const matches =
    verification.profile.toLowerCase() ===
    CONFIG.screenshot.dns.expectedProfileId.toLowerCase();

  return {
    matches,
    reason: matches ? "profile-match" : "profile-mismatch",
    profile: verification.profile,
    expectedProfileId: CONFIG.screenshot.dns.expectedProfileId,
    protocol: verification.protocol,
    statusValue: verification.statusValue,
  };
};

const buildBrowserDohConfig = (): string => {
  return CONFIG.screenshot.dns.browserDohTemplate;
};

export interface DnsLaunchConfig {
  launchArgs: string[];
  userDataDir: string | null;
}

export const createDnsLaunchConfig = async (
  baseArgs: string[],
): Promise<DnsLaunchConfig> => {
  const launchArgs = [...baseArgs];
  let userDataDir: string | null = null;

  if (CONFIG.screenshot.dns.enabled) {
    launchArgs.push("--enable-features=AsyncDns");

    userDataDir = await mkdtemp(join(tmpdir(), "snapservice-dns-"));
    const localState = {
      dns_over_https: {
        mode: "secure",
        templates: buildBrowserDohConfig(),
      },
      async_dns: {
        enabled: true,
      },
    };
    await writeFile(
      join(userDataDir, "Local State"),
      JSON.stringify(localState),
    );
  }

  return { launchArgs, userDataDir };
};

export const cleanupDnsLaunchConfig = async (
  userDataDir: string | null,
): Promise<void> => {
  if (userDataDir) {
    await rm(userDataDir, { recursive: true, force: true });
  }
};
