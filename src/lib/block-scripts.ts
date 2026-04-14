import type { HTTPRequest, Page } from "puppeteer";

export const applySmartBlocker = async (page: Page) => {
  const WHITELIST_REGEX =
    /^(?:.*?\.)?(?:fbcdn\.net|facebook\.net|gstatic\.com|googleapis\.com|licdn\.com|twimg\.com|cloudflare\.com|jsdelivr\.net|unpkg\.com|github\.githubassets\.com)$/i;

  await page.setRequestInterception(true);

  page.on("request", (request: HTTPRequest) => {
    // 1. Always allow navigation requests first
    if (request.isNavigationRequest()) {
      return request.continue();
    }

    try {
      const url = new URL(request.url());
      const hostname = url.hostname;

      // Calculate current base domain dynamically per request
      const pageUrl = new URL(page.url());
      const domainParts = pageUrl.hostname.split(".");
      const baseDomain = domainParts.slice(-2).join(".");

      const isInternal =
        hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
      const isWhitelisted = WHITELIST_REGEX.test(hostname);

      if (request.resourceType() === "script") {
        if (isInternal || isWhitelisted) {
          request.continue();
        } else {
          request.abort();
        }
      } else {
        request.continue();
      }
    } catch (_e) {
      // Fallback for edge cases (like data URIs)
      request.continue();
    }
  });
};
