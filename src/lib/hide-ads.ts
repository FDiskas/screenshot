import type { Page } from "puppeteer";

export async function hideAdsElements(page: Page) {
  await page.addStyleTag({
    content: `
      .ad,
      .ads,
      .banner,
      .banners,
      .sponsor,
      .sponsors {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        max-height: 0 !important;
        pointer-events: none !important;
      }
    `,
  });
}
