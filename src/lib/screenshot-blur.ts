import type { Page } from "puppeteer";

export interface BlurCandidateMetrics {
  width: number;
  height: number;
  area: number;
  intrinsicArea: number;
  hasBackgroundImage: boolean;
  pictureHasSources: boolean;
  inViewport: boolean;
  hasRenderableMedia: boolean;
}

export interface BlurConfig {
  selector: string;
  minWidthPx: number;
  minHeightPx: number;
  minAreaPx: number;
  minIntrinsicAreaPx: number;
  blurPx: number;
  blurVisibleMediaInViewport: boolean;
}

export const shouldBlurMediaCandidate = (
  metrics: BlurCandidateMetrics,
  config: BlurConfig,
): boolean => {
  const isLargeEnough =
    (metrics.width >= config.minWidthPx &&
      metrics.height >= config.minHeightPx &&
      metrics.area >= config.minAreaPx) ||
    metrics.intrinsicArea >= config.minIntrinsicAreaPx ||
    (metrics.hasBackgroundImage && metrics.area >= config.minAreaPx) ||
    metrics.pictureHasSources;

  const shouldBlurByViewport =
    config.blurVisibleMediaInViewport &&
    metrics.inViewport &&
    metrics.hasRenderableMedia &&
    metrics.area >= 4000;

  return isLargeEnough || shouldBlurByViewport;
};

export const applyMediaBlur = async (
  page: Page,
  blurConfig: BlurConfig,
): Promise<void> => {
  await page.evaluate((config) => {
    const doc = (globalThis as any).document;
    const win = (globalThis as any).window;
    if (!doc) {
      return;
    }

    const blurAttr = "data-snap-blur";
    const styleId = "snap-blur-style";

    const installBlurStyle = () => {
      try {
        const css = `
          [${blurAttr}="1"] {
            filter: blur(${config.blurPx}px) !important;
            -webkit-filter: blur(${config.blurPx}px) !important;
          }
          picture[${blurAttr}="1"] img,
          picture[${blurAttr}="1"] source,
          figure[${blurAttr}="1"] img {
            filter: blur(${config.blurPx}px) !important;
            -webkit-filter: blur(${config.blurPx}px) !important;
          }
        `;

        let styleNode = doc.getElementById(styleId);
        if (!styleNode) {
          styleNode = doc.createElement("style");
          styleNode.id = styleId;
          doc.head?.appendChild(styleNode);
        }
        styleNode.textContent = css;
      } catch {
        // Ignore style-tag failures (e.g. CSP); inline style fallback still runs.
      }
    };

    const getIntrinsicArea = (node: any): number => {
      const tag = String(node?.tagName || "").toUpperCase();

      if (tag === "IMG") {
        return (
          (Number(node.naturalWidth) || 0) * (Number(node.naturalHeight) || 0)
        );
      }

      if (tag === "VIDEO") {
        return (Number(node.videoWidth) || 0) * (Number(node.videoHeight) || 0);
      }

      if (tag === "PICTURE") {
        const img = node.querySelector?.("img");
        if (!img) {
          return 0;
        }
        return (
          (Number(img.naturalWidth) || 0) * (Number(img.naturalHeight) || 0)
        );
      }

      return 0;
    };

    const hasBackgroundImage = (node: any): boolean => {
      if (!win?.getComputedStyle) {
        return false;
      }
      const bg = win.getComputedStyle(node).backgroundImage || "";
      return bg !== "none";
    };

    const applyBlur = (node: any) => {
      if (!node) {
        return;
      }
      node.setAttribute?.(blurAttr, "1");
      if (node.style) {
        node.style.setProperty(
          "filter",
          `blur(${config.blurPx}px)`,
          "important",
        );
        node.style.setProperty(
          "-webkit-filter",
          `blur(${config.blurPx}px)`,
          "important",
        );
      }
    };

    installBlurStyle();

    const elements = Array.from(doc.querySelectorAll(config.selector));
    for (const element of elements) {
      const node = element as any;
      if (!node || typeof node.getBoundingClientRect !== "function") {
        continue;
      }

      const rect = node.getBoundingClientRect();
      const width = Math.max(0, rect.width);
      const height = Math.max(0, rect.height);
      const area = width * height;
      const intrinsicArea = getIntrinsicArea(node);
      const backgroundImage = hasBackgroundImage(node);
      const tag = String(node.tagName || "").toUpperCase();
      const pictureHasSources =
        tag === "PICTURE" &&
        (node.querySelectorAll?.("source[srcset]")?.length || 0) > 0;
      const inViewport =
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < (win?.innerHeight || 0) &&
        rect.left < (win?.innerWidth || 0);
      const hasRenderableMedia =
        tag === "IMG" ||
        tag === "VIDEO" ||
        tag === "CANVAS" ||
        tag === "SVG" ||
        tag === "PICTURE" ||
        backgroundImage;

      const isLargeEnough =
        (width >= config.minWidthPx &&
          height >= config.minHeightPx &&
          area >= config.minAreaPx) ||
        intrinsicArea >= config.minIntrinsicAreaPx ||
        (backgroundImage && area >= config.minAreaPx) ||
        pictureHasSources;

      const shouldBlurByViewport =
        config.blurVisibleMediaInViewport &&
        inViewport &&
        hasRenderableMedia &&
        area >= 4000;

      if (!isLargeEnough && !shouldBlurByViewport) {
        continue;
      }

      applyBlur(node);

      if (tag === "PICTURE") {
        const pictureImg = node.querySelector?.("img");
        if (pictureImg) {
          applyBlur(pictureImg);
        }
      }
    }

    win?.requestAnimationFrame?.(() => installBlurStyle());
  }, blurConfig);
};
