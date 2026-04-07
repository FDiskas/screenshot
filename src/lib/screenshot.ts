import puppeteer from "puppeteer";
import sharp from "sharp";
import { CONFIG } from "../config";
import { applyConsentHiding } from "./screenshot-consent";
import { applyMediaBlur } from "./screenshot-blur";

const resolveViaAdGuardDns = async (hostname: string): Promise<boolean> => {
  if (!CONFIG.screenshot.dns.preferAdguard) {
    return false;
  }

  try {
    const dnsUrl = `${CONFIG.screenshot.dns.preflightJsonEndpoint}?name=${encodeURIComponent(hostname)}&type=A`;
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
      Answer?: Array<{ data?: string }>;
    };
    return (
      Array.isArray(data.Answer) && data.Answer.some((answer) => !!answer?.data)
    );
  } catch {
    return false;
  }
};

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

export const captureScreenshot = async (
  options: ScreenshotOptions,
): Promise<ScreenshotResult> => {
  const {
    url,
    width = CONFIG.screenshot.defaultWidth,
    height = CONFIG.screenshot.defaultHeight,
  } = options;

  let browser;
  try {
    // Only allow HTTPS
    if (!url.startsWith(CONFIG.screenshot.allowedProtocol)) {
      return {
        buffer: null,
        status: 400,
        error: "Only HTTPS URLs are allowed",
      };
    }

    let adguardDnsAvailable = false;
    try {
      adguardDnsAvailable = await resolveViaAdGuardDns(new URL(url).hostname);
    } catch {
      adguardDnsAvailable = false;
    }

    const launchArgs = [...CONFIG.screenshot.browserLaunchArgs];
    if (CONFIG.screenshot.dns.preferAdguard) {
      launchArgs.push(
        "--enable-features=DnsOverHttps",
        "--dns-over-https-mode=secure",
        `--dns-over-https-templates=${CONFIG.screenshot.dns.browserDohTemplate}`,
      );
    }

    browser = await puppeteer.launch({
      headless: true,
      args: launchArgs,
    });

    if (CONFIG.screenshot.dns.preferAdguard && !adguardDnsAvailable) {
      console.warn(
        `AdGuard DNS preflight lookup failed for ${url}, continuing with browser resolver.`,
      );
    }

    const page = await browser.newPage();
    await page.setViewport({
      width: CONFIG.screenshot.desktopViewportWidth,
      height: CONFIG.screenshot.desktopViewportHeight,
    });
    await page.emulateMediaFeatures([
      {
        name: "prefers-color-scheme",
        value: CONFIG.screenshot.emulatedColorScheme,
      },
    ]);

    page.setDefaultNavigationTimeout(CONFIG.screenshot.responseTimeoutMs);
    page.setDefaultTimeout(CONFIG.screenshot.responseTimeoutMs);

    const response = await page.goto(url, {
      // We only require initial response and basic DOM availability within 5s.
      waitUntil: "domcontentloaded",
      timeout: CONFIG.screenshot.responseTimeoutMs,
    });

    await new Promise((resolve) =>
      setTimeout(resolve, CONFIG.server.processingRefreshSeconds * 1000),
    );

    await applyConsentHiding(page, url);

    if (!response) {
      return { buffer: null, status: 500, error: "Failed to load page" };
    }

    const status = response.status();
    const finalUrl = page.url();

    if (status !== 200) {
      return { buffer: null, status, finalUrl };
    }

    if (CONFIG.screenshot.blurLargeMedia.enabled) {
      await applyMediaBlur(page, CONFIG.screenshot.blurLargeMedia);
    }

    // Take screenshot of the desktop viewport
    const rawBuffer = (await page.screenshot({ type: "png" })) as Buffer;

    // Resize to the desired dimensions without cropping by default.
    const resizedBuffer = await sharp(rawBuffer)
      .resize(width, height, {
        fit: CONFIG.screenshot.resize.fit,
        position: CONFIG.screenshot.resize.position,
        background: CONFIG.screenshot.resize.background,
        withoutEnlargement: CONFIG.screenshot.resize.withoutEnlargement,
      })
      .toBuffer();

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
    const finalBuffer = await sharp(resizedBuffer)
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
  }
};
