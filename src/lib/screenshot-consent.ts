import type { Page } from "puppeteer";

export const CONSENT_HIDE_STYLE_CONTENT = `
  [id*="cookie" i], [class*="cookie" i],
  [id*="consent" i], [class*="consent" i], .consent, [class~="consent" i],
  .fc-consent-root, [class*="fc-consent" i], [id*="fc-consent" i],
  [id*="banner" i], [class*="banner" i],
  [id*="cmp-" i], [class*="cmp-" i],
  iframe[src*="consent" i], iframe[id*="consent" i], iframe[class*="consent" i],
  iframe[src*="cookie" i], iframe[id*="cookie" i], iframe[class*="cookie" i],
  #onetrust-banner-sdk, .ot-sdk-container,
  [aria-label*="cookie" i], [aria-label*="consent" i] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;

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
      const attrsToCheck = [
        node?.id || "",
        node?.className || "",
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
