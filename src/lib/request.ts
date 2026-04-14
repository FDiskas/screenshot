import { CONFIG } from "../config";

export interface ScreenshotParams {
  url: string;
  width: number;
  height: number;
}

export interface ResolvedDomain {
  domain: string;
  domainUrl: string;
}

export function parseScreenshotParams(
  rawUrl: string | undefined,
  rawWidth: string | undefined,
  rawHeight: string | undefined,
): ScreenshotParams | null {
  if (!rawUrl) return null;

  let url = rawUrl;
  if (url.startsWith("http://")) {
    url = url.replace("http://", "https://");
  }

  const width = parseInt(
    rawWidth || String(CONFIG.screenshot.defaultWidth),
    10,
  );
  const height = parseInt(
    rawHeight || String(CONFIG.screenshot.defaultHeight),
    10,
  );

  return { url, width, height };
}

export function isValidScreenshotUrl(url: string): boolean {
  return url.startsWith("https://");
}

export function resolveScreenshotDomain(url: string): ResolvedDomain | null {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.toLowerCase();
    const domainUrl = `https://${domain}`;
    return { domain, domainUrl };
  } catch {
    return null;
  }
}
