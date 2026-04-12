import type { Page } from "puppeteer";

/**
 * Injected CSS only — avoid `[class*="consent"]`-style matches: Funding Choices uses
 * `.fc-consent-root` for a full-viewport layer; substring “consent” hides the whole tree
 * while the article stays gated until the user accepts (blank screenshot).
 */
export const CONSENT_HIDE_STYLE_CONTENT = `
  [id*="cookie" i], [class*="cookie" i],
  .consent, [class~="consent" i],
  [class*="cookie-banner" i], [id*="cookie-banner" i],
  [class*="consent-banner" i], [id*="consent-banner" i],
  [id*="cmp-" i], [class*="cmp-" i],
  iframe[src*="consent" i], iframe[id*="consent" i], iframe[class*="consent" i],
  iframe[src*="cookie" i], iframe[id*="cookie" i], iframe[class*="cookie" i],
  #onetrust-banner-sdk, .ot-sdk-container,
  [aria-label*="cookie" i] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;

/** Funding Choices, OneTrust, common patterns — try in order; one successful click is enough. */
const CONSENT_CLICK_SELECTORS = [
  ".fc-cta-consent",
  "#onetrust-accept-btn-handler",
  "button#accept-recommended-btn-handler",
  'button[aria-label="Accept All Cookies"]',
  'button[aria-label="Accept all"]',
] as const;

export const tryDismissConsentDialogs = async (
  page: Page,
  budgetMs: number,
): Promise<void> => {
  const deadline = Date.now() + Math.max(0, budgetMs);

  for (const selector of CONSENT_CLICK_SELECTORS) {
    const remaining = deadline - Date.now();
    if (remaining < 400) {
      return;
    }
    const waitMs = Math.min(3500, remaining - 300);
    if (waitMs < 400) {
      return;
    }

    const handle = await page
      .waitForSelector(selector, {
        timeout: waitMs,
        visible: true,
      })
      .catch(() => null);

    if (!handle) {
      continue;
    }

    try {
      await handle.click();
    } catch {
      continue;
    }

    const pause = Math.min(3000, Math.max(800, deadline - Date.now()));
    await new Promise((r) => setTimeout(r, pause));
    return;
  }
};

export const containsConsentToken = (value: string | undefined): boolean => {
  return /consent/i.test(String(value || ""));
};

export const shouldHideConsentNodeFromAttributes = (
  attrs: Record<string, string | undefined>,
): boolean => {
  return Object.values(attrs).some((value) => containsConsentToken(value));
};

export const applyConsentHiding = async (
  page: Page,
  url: string,
): Promise<void> => {
  try {
    await page.addStyleTag({ content: CONSENT_HIDE_STYLE_CONTENT });
  } catch (e: any) {
    console.warn(
      `Style injection blocked for ${url}: ${e?.message || "unknown error"}`,
    );
  }

  await page.evaluate(() => {
    const CONSENT_RE = /consent/i;
    const HIDE_ATTR = "data-snap-consent-hidden";
    const doc = (globalThis as any).document;
    const MutationObserverCtor = (globalThis as any).MutationObserver;

    if (!doc) {
      return;
    }

    const shouldHideNode = (node: any): boolean => {
      const cls = String(node?.className || "");
      const id = String(node?.id || "");
      if (/\bfc-consent-root\b/i.test(cls) || /\bfc-consent-root\b/i.test(id)) {
        return false;
      }

      const attrsToCheck = [
        id,
        cls,
        node?.getAttribute?.("name") || "",
        node?.getAttribute?.("aria-label") || "",
        node?.getAttribute?.("role") || "",
        node?.getAttribute?.("src") || "",
        node?.getAttribute?.("title") || "",
        node?.getAttribute?.("data-testid") || "",
      ];

      return attrsToCheck.some((value) => CONSENT_RE.test(String(value)));
    };

    const hideNode = (node: any) => {
      if (node?.getAttribute?.(HIDE_ATTR) === "1") {
        return;
      }
      node?.setAttribute?.(HIDE_ATTR, "1");
      if (node?.style?.setProperty) {
        node.style.setProperty("display", "none", "important");
        node.style.setProperty("visibility", "hidden", "important");
        node.style.setProperty("opacity", "0", "important");
        node.style.setProperty("pointer-events", "none", "important");
      }
    };

    const sweep = (root?: any) => {
      const scope = root || doc;
      const all = Array.from(scope?.querySelectorAll?.("*") || []);
      for (const node of all) {
        if (shouldHideNode(node)) {
          hideNode(node);
        }
      }
    };

    sweep();

    if (!MutationObserverCtor) {
      return;
    }

    const observer = new MutationObserverCtor((mutations: any[]) => {
      for (const mutation of mutations || []) {
        for (const added of Array.from(mutation?.addedNodes || [])) {
          if (!added || !(added as any).querySelectorAll) {
            continue;
          }
          if (shouldHideNode(added)) {
            hideNode(added);
          }
          sweep(added);
        }
      }
    });

    observer.observe(doc.documentElement, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => observer.disconnect(), 2000);
  });
};
