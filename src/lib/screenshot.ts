import "./sharp-config";
import path from "node:path";
import {
  type Browser,
  DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
  type Page,
} from "puppeteer";
import puppeteer from "puppeteer-extra";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import sharp from "sharp";

import { CONFIG } from "../config";
import { applySmartBlocker } from "./block-scripts";
import { hideAdsElements } from "./hide-ads";
import { applyMediaBlur } from "./screenshot-blur";
import { createStatusFallbackBuffer } from "./screenshot-status-fallback";

// Register plugins once at module scope
puppeteer.use(
  AdblockerPlugin({
    blockTrackers: true,
    blockTrackersAndAnnoyances: true,
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
    useCache: false,
  }),
);

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

const pathToExtension = path.resolve(
  path.dirname(require.resolve("@duckduckgo/autoconsent")),
  "addon-mv3",
);

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
    const html = globalThis.document?.documentElement;
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
    .replace(/"/g, "&quot;")
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
          waitUntil: "networkidle0",
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

async function configurePage(page: Page): Promise<void> {
  // Explicitly prevent file downloads.
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

  await page.emulateMediaFeatures([
    {
      name: "prefers-color-scheme",
      value: CONFIG.screenshot.emulatedColorScheme,
    },
  ]);

  page.setDefaultNavigationTimeout(CONFIG.screenshot.responseTimeoutMs);
  page.setDefaultTimeout(CONFIG.screenshot.responseTimeoutMs);
}

async function navigateToPage(
  page: Page,
  url: string,
  width: number,
  height: number,
): Promise<{ status: number; finalUrl?: string; fallbackBuffer?: Buffer }> {
  const response = await page.goto(url, {
    timeout: CONFIG.screenshot.responseTimeoutMs,
  });

  if (!response) {
    return { status: 500 };
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

  const status = response.status();
  const finalUrl = page.url();

  if (status !== 200) {
    const fallbackBuffer = await createStatusFallbackBuffer(
      width,
      height,
      status,
    );
    return { status, finalUrl, fallbackBuffer };
  }

  return { status, finalUrl };
}

function extractHostForOverlay(finalUrl: string, originalUrl: string): string {
  try {
    return new URL(finalUrl).hostname;
  } catch {
    try {
      return new URL(originalUrl).hostname;
    } catch {
      return "unknown-host";
    }
  }
}

async function processImagePipeline(
  rawBuffer: Buffer,
  width: number,
  height: number,
  overlayHost: string,
): Promise<Buffer> {
  const overlaySvg = buildOverlaySvg(width, height, overlayHost);

  return sharp(rawBuffer)
    .resize(width, height, {
      fit: CONFIG.screenshot.resize.fit,
      position: CONFIG.screenshot.resize.position,
      background: CONFIG.screenshot.resize.background,
      withoutEnlargement: CONFIG.screenshot.resize.withoutEnlargement,
    })
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function handlePuppeteerError(error: unknown, url: string): ScreenshotResult {
  if (error instanceof Error) {
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

    if (
      error.message.includes("ERR_CERT_AUTHORITY_INVALID") ||
      error.message.includes("SSL certificate error")
    ) {
      return { buffer: null, status: 495, error: "Invalid SSL certificate" };
    }
  }

  return {
    buffer: null,
    status: 500,
    error: error instanceof Error ? error.message : String(error),
  };
}

export const captureScreenshot = async (
  options: ScreenshotOptions,
): Promise<ScreenshotResult> => {
  const {
    url,
    width = CONFIG.screenshot.defaultWidth,
    height = CONFIG.screenshot.defaultHeight,
  } = options;

  let browser: Browser | null = null;
  let page: Page | null = null;
  let rawBuffer: Buffer | null = null;
  let finalBuffer: Buffer | null = null;
  const userDataDir: string | null = null;

  try {
    if (!url.startsWith(CONFIG.screenshot.allowedProtocol)) {
      return {
        buffer: null,
        status: 400,
        error: "Only HTTPS URLs are allowed",
      };
    }

    browser = await puppeteer.launch({
      headless: true,
      args: [
        ...CONFIG.screenshot.browserLaunchArgs,
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
      ...(userDataDir ? { userDataDir } : {}),
    });

    page = await browser.newPage();
    await applySmartBlocker(page);
    await configurePage(page);

    const { status, finalUrl, fallbackBuffer } = await navigateToPage(
      page,
      url,
      width,
      height,
    );

    if (status !== 200) {
      return { buffer: fallbackBuffer || null, status, finalUrl };
    }

    if (CONFIG.screenshot.blurLargeMedia.enabled) {
      await applyMediaBlur(page, CONFIG.screenshot.blurLargeMedia);
    }

    await hideAdsElements(page);
    await applyPageZoom(page);

    rawBuffer = (await page.screenshot({ type: "png" })) as Buffer;
    const overlayHost = extractHostForOverlay(finalUrl || url, url);
    finalBuffer = await processImagePipeline(
      rawBuffer,
      width,
      height,
      overlayHost,
    );

    // Release memory ASAP
    rawBuffer = null;
    const result = { buffer: finalBuffer, status, finalUrl };
    finalBuffer = null;
    return result;
  } catch (error) {
    return handlePuppeteerError(error, url);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {}
      page = null;
    }
    if (browser) {
      try {
        await browser.close();
      } catch {}
      browser = null;
    }
    rawBuffer = null;
    finalBuffer = null;
  }
};
