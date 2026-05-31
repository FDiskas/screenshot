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

  let url = rawUrl.trim();
  if (url.startsWith("http://")) {
    url = url.replace("http://", "https://");
  } else if (!url.startsWith("https://") && !url.includes("://")) {
    url = `https://${url}`;
  }

  const requestedWidth = rawWidth ? parseInt(rawWidth, 10) : undefined;
  const requestedHeight = rawHeight ? parseInt(rawHeight, 10) : undefined;

  let width: number = CONFIG.screenshot.defaultWidth;
  let height: number = CONFIG.screenshot.defaultHeight;

  if (requestedWidth && requestedHeight) {
    const isValid = CONFIG.screenshot.allowedResolutions.some(
      (res) => res.width === requestedWidth && res.height === requestedHeight,
    );
    if (isValid) {
      width = requestedWidth;
      height = requestedHeight;
    }
  } else if (requestedWidth) {
    const match = CONFIG.screenshot.allowedResolutions.find(
      (res) => res.width === requestedWidth,
    );
    if (match) {
      width = match.width;
      height = match.height;
    }
  } else if (requestedHeight) {
    const match = CONFIG.screenshot.allowedResolutions.find(
      (res) => res.height === requestedHeight,
    );
    if (match) {
      width = match.width;
      height = match.height;
    }
  }

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
