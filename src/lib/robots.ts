import { CONFIG } from "../config";

export const checkRobotsTxt = async (url: string): Promise<boolean> => {
  try {
    const origin = new URL(url).origin;
    const robotsUrl = `${origin}/robots.txt`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": CONFIG.screenshot.browserUserAgent,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      return true; // If no robots.txt or error, assume allowed
    }

    const text = await response.text();

    let isTargetUserAgent = false;
    let isAllowed = true;

    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (!trimmed || trimmed.startsWith("#")) continue;

      if (trimmed.startsWith("user-agent:")) {
        const agent = trimmed.substring(11).trim();
        // We look for general rules, or specific ones for 'snapservice'
        if (agent === "*" || agent === "snapservice") {
          isTargetUserAgent = true;
        } else {
          isTargetUserAgent = false;
        }
      } else if (isTargetUserAgent) {
        if (trimmed.startsWith("disallow:")) {
          const path = trimmed.substring(9).trim();
          // Homepage matching
          if (path === "/" || path === "/*") {
            isAllowed = false;
          }
        } else if (trimmed.startsWith("allow:")) {
          const path = trimmed.substring(6).trim();
          if (path === "/" || path === "/*") {
            isAllowed = true;
          }
        }
      }
    }

    return isAllowed;
  } catch (_error) {
    // Network errors, timeouts, etc.
    return true;
  }
};
