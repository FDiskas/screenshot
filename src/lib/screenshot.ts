import "./sharp-config";
import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import sharp from "sharp";

import { CONFIG } from "../config";
import {
  applyConsentHiding,
  tryDismissConsentDialogs,
} from "./screenshot-consent";
import { applyMediaBlur } from "./screenshot-blur";
import { createStatusFallbackBuffer } from "./screenshot-status-fallback";
import {
  cleanupDnsLaunchConfig,
  createDnsLaunchConfig,
  resolveViaConfiguredDns,
  verifyConfiguredDnsProfileDetailed,
  type DnsProfileVerificationResult,
} from "./dns";

export interface ScreenshotOptions {
  url: string;
  width?: number;
  height?: number;
}

export interface ScreenshotResult {
  buffer: Buffer | null;
  status: number;
  error?: string;
  finalUrl?: string;
}

const applyPageZoom = async (page: Page): Promise<void> => {
  const zoomPercent: number = CONFIG.screenshot.pageZoomPercent;
  if (
    !Number.isFinite(zoomPercent) ||
    zoomPercent <= 0 ||
    zoomPercent === 100
  ) {
    return;
  }

  const zoomFactor = zoomPercent / 100;
  await page.evaluate((factor: number) => {
    const html = (globalThis as any).document?.documentElement;
    if (!html) {
      return;
    }
    html.style.zoom = String(factor);
  }, zoomFactor);
};

/**
 * Reddit and other properties often return HTTP 403 when they see automation-only clients:
 * missing UA-CH vs User-Agent, navigator.webdriver, or the AutomationControlled blink flag.
 */
const preparePageForAutomationCapture = async (page: Page): Promise<void> => {
  await page.evaluateOnNewDocument(() => {
    try {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
        configurable: true,
      });
    } catch {
      /* ignore */
    }
  });

  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  const hints = CONFIG.screenshot.browserUserAgentClientHints;
  await page.setUserAgent({
    userAgent: CONFIG.screenshot.browserUserAgent,
    // CONFIG is `as const`; Puppeteer expects mutable UserAgentMetadata.
    userAgentMetadata: JSON.parse(JSON.stringify(hints)),
  });
};

const escapeXml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const buildOverlaySvg = (
  width: number,
  height: number,
  host: string,
): string => {
  const safeHost = escapeXml(host);
  const copyrightX = Math.max(8, width - 56);
  const copyrightY = Math.max(16, height - 12);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="34" fill="rgba(0,0,0,0.45)" />
      <text x="12" y="22" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="600">${safeHost}</text>
      <text x="${copyrightX + 1}" y="${copyrightY + 1}" fill="rgba(0,0,0,0.45)" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="start">&#169;oders</text>
      <text x="${copyrightX}" y="${copyrightY}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="start">&#169;oders</text>
    </svg>
  `;
};

export interface DnsDiagnosticLogParams {
  hostname: string;
  dnsEnabled: boolean;
  dnsProviderAvailable: boolean;
  verification: DnsProfileVerificationResult;
  verificationEndpoint: string;
  enforceProfileMatch: boolean;
}

/**
 * Puppeteer follows HTTP redirects automatically. We still wait for `load` (not only
 * `domcontentloaded`) and then until the URL stops changing so late `location` /
 * SPA navigations finish before the screenshot.
 */
const waitForUrlToStabilize = async (
  page: Page,
  maxMs: number,
  stableMs: number,
): Promise<void> => {
  const deadline = Date.now() + maxMs;
  let lastUrl = page.url();
  let stableSince = Date.now();

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
    const current = page.url();
    if (current !== lastUrl) {
      lastUrl = current;
      stableSince = Date.now();
      try {
        await page.waitForNavigation({
          waitUntil: "load",
          timeout: Math.max(500, deadline - Date.now()),
        });
      } catch {
        // Navigation may already have completed.
      }
      lastUrl = page.url();
      stableSince = Date.now();
    } else if (Date.now() - stableSince >= stableMs) {
      return;
    }
  }
};

export const emitDnsDiagnosticLog = (params: DnsDiagnosticLogParams): void => {
  if (!CONFIG.screenshot.dns.verboseLogging) {
    return;
  }
  const {
    hostname,
    dnsEnabled,
    dnsProviderAvailable,
    verification,
    verificationEndpoint,
    enforceProfileMatch,
  } = params;
  const entry = {
    hostname,
    dnsEnabled,
    dnsProviderAvailable,
    matches: verification.matches,
    reason: verification.reason,
    statusValue: verification.statusValue,
    protocol: verification.protocol,
    profile: verification.profile,
    expectedProfileId: verification.expectedProfileId,
    verificationEndpoint,
    enforceProfileMatch,
  };
  const label = `[DNS] ${CONFIG.screenshot.dns.providerName} verification`;
  if (verification.matches === false) {
    console.warn(label, entry);
  } else {
    // matches === true (success) or matches === null (unreachable/error)
    console.info(label, entry);
  }
};

export const captureScreenshot = async (
  options: ScreenshotOptions,
): Promise<ScreenshotResult> => {
  const {
    url,
    width = CONFIG.screenshot.defaultWidth,
    height = CONFIG.screenshot.defaultHeight,
  } = options;

  let browser;
  let userDataDir: string | null = null;
  try {
    // Only allow HTTPS
    if (!url.startsWith(CONFIG.screenshot.allowedProtocol)) {
      return {
        buffer: null,
        status: 400,
        error: "Only HTTPS URLs are allowed",
      };
    }

    let dnsProviderAvailable = false;
    const hostname = new URL(url).hostname;
    try {
      dnsProviderAvailable = await resolveViaConfiguredDns(hostname);
    } catch {
      dnsProviderAvailable = false;
    }

    const dnsLaunchConfig = await createDnsLaunchConfig(
      CONFIG.screenshot.browserLaunchArgs,
    );
    userDataDir = dnsLaunchConfig.userDataDir;

    browser = await puppeteer.launch({
      headless: true,
      args: dnsLaunchConfig.launchArgs,
      ...(userDataDir ? { userDataDir } : {}),
    });

    const page = await browser.newPage();

    // Explicitly prevent file downloads.
    // CDPSession must be detached after use — it holds native transport handles
    // that Puppeteer does not automatically release when the page closes.
    const client = await page.createCDPSession();
    try {
      await client
        .send("Browser.setDownloadBehavior", {
          behavior: "deny",
          eventsEnabled: false,
        })
        .catch(() =>
          client.send("Page.setDownloadBehavior", { behavior: "deny" }),
        )
        .catch(() => {
          console.warn("Could not set download behavior");
        });
    } finally {
      await client.detach().catch(() => {});
    }

    await page.setViewport({
      width: CONFIG.screenshot.desktopViewportWidth,
      height: CONFIG.screenshot.desktopViewportHeight,
    });

    await preparePageForAutomationCapture(page);

    if (CONFIG.screenshot.dns.enabled && CONFIG.screenshot.dns.checkDnsStatus) {
      const profileVerification =
        await verifyConfiguredDnsProfileDetailed(page);
      if (
        profileVerification.matches === false &&
        CONFIG.screenshot.dns.enforceProfileMatch
      ) {
        const message =
          profileVerification.reason === "doh-inactive"
            ? `${CONFIG.screenshot.dns.providerName} DoH verification failed for ${url}; expected status=ok and protocol=DOH but got status=${profileVerification.statusValue ?? "unknown"}, protocol=${profileVerification.protocol ?? "unknown"}.`
            : `${CONFIG.screenshot.dns.providerName} profile mismatch for ${url}; expected ${profileVerification.expectedProfileId ?? "(not set)"}, got ${profileVerification.profile ?? "unknown"}.`;
        return {
          buffer: null,
          status: 503,
          error: message,
        };
      }
      emitDnsDiagnosticLog({
        hostname,
        dnsEnabled: CONFIG.screenshot.dns.enabled,
        dnsProviderAvailable,
        verification: profileVerification,
        verificationEndpoint: CONFIG.screenshot.dns.verificationEndpoint,
        enforceProfileMatch: CONFIG.screenshot.dns.enforceProfileMatch,
      });
    }

    await page.emulateMediaFeatures([
      {
        name: "prefers-color-scheme",
        value: CONFIG.screenshot.emulatedColorScheme,
      },
    ]);

    page.setDefaultNavigationTimeout(CONFIG.screenshot.responseTimeoutMs);
    page.setDefaultTimeout(CONFIG.screenshot.responseTimeoutMs);

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: CONFIG.screenshot.responseTimeoutMs,
    });

    if (!response) {
      return { buffer: null, status: 500, error: "Failed to load page" };
    }

    const settleMax = Math.min(
      CONFIG.screenshot.redirectSettleMaxMs,
      CONFIG.screenshot.responseTimeoutMs,
    );

    await waitForUrlToStabilize(
      page,
      settleMax,
      CONFIG.screenshot.redirectSettleStableMs,
    );

    await new Promise((resolve) =>
      setTimeout(resolve, CONFIG.screenshot.pageSettleMs),
    );

    await tryDismissConsentDialogs(
      page,
      CONFIG.screenshot.consentClickBudgetMs,
    );
    await applyConsentHiding(page, page.url());

    const status = response.status();
    const finalUrl = page.url();

    if (status !== 200) {
      const fallbackBuffer = await createStatusFallbackBuffer(
        width,
        height,
        status,
      );
      return { buffer: fallbackBuffer, status, finalUrl };
    }

    if (CONFIG.screenshot.blurLargeMedia.enabled) {
      await applyMediaBlur(page, CONFIG.screenshot.blurLargeMedia);
    }

    await applyPageZoom(page);

    // Take screenshot of the desktop viewport
    const rawBuffer = (await page.screenshot({ type: "png" })) as Buffer;

    const overlayHost = (() => {
      try {
        return new URL(finalUrl).hostname;
      } catch {
        try {
          return new URL(url).hostname;
        } catch {
          return "unknown-host";
        }
      }
    })();

    const overlaySvg = buildOverlaySvg(width, height, overlayHost);

    // Chain resize + composite in a single Sharp pipeline.
    // This avoids holding rawBuffer + resizedBuffer + finalBuffer in memory
    // simultaneously (~1–2 MB peak saving per job).
    const finalBuffer = await sharp(rawBuffer)
      .resize(width, height, {
        fit: CONFIG.screenshot.resize.fit,
        position: CONFIG.screenshot.resize.position,
        background: CONFIG.screenshot.resize.background,
        withoutEnlargement: CONFIG.screenshot.resize.withoutEnlargement,
      })
      .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    return { buffer: finalBuffer, status, finalUrl };
  } catch (error: any) {
    console.error(`Puppeteer error for ${url}:`, error.message);

    if (
      error.message.includes("Navigation timeout") ||
      error.message.includes("Timeout")
    ) {
      return {
        buffer: null,
        status: 504,
        error: `Website did not respond within ${CONFIG.screenshot.responseTimeoutMs / 1000}s`,
      };
    }

    // Handle certificate errors specifically if possible
    if (
      error.message.includes("ERR_CERT_AUTHORITY_INVALID") ||
      error.message.includes("SSL certificate error")
    ) {
      return { buffer: null, status: 495, error: "Invalid SSL certificate" };
    }

    return { buffer: null, status: 500, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
    if (userDataDir) {
      await cleanupDnsLaunchConfig(userDataDir);
    }
  }
};
