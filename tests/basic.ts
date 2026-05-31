import path from "node:path";
import puppeteer from "puppeteer-extra";
import Adblocker from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { CONFIG } from "../src/config";
import { applySmartBlocker } from "../src/lib/block-scripts";
import { hideAdsElements } from "../src/lib/hide-ads";
import { applyMediaBlur } from "../src/lib/screenshot-blur";

puppeteer.use(StealthPlugin());

puppeteer.use(
  Adblocker({
    blockTrackers: true,
    blockTrackersAndAnnoyances: true,
    useCache: true,
  }),
);

const pathToExtension = path.resolve(
  path.dirname(require.resolve("@duckduckgo/autoconsent")),
  "addon-mv3",
);

puppeteer
  .launch({
    headless: true,
    defaultViewport: null,
    args: [
      ...CONFIG.screenshot.browserLaunchArgs,
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  })
  .then(async (browser) => {
    const page = await browser.newPage();

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    await applySmartBlocker(page);

    await page.setViewport({
      width: CONFIG.screenshot.desktopViewportWidth,
      height: CONFIG.screenshot.desktopViewportHeight,
    });

    await page.setUserAgent({
      userAgent: CONFIG.screenshot.browserUserAgent,
      userAgentMetadata: JSON.parse(
        JSON.stringify(CONFIG.screenshot.browserUserAgentClientHints),
      ),
    });

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.google.com/",
    });

    const response = await page.goto(
      // "https://www.tripadvisor.com/Attraction_Review-g1185604-d2614375-Reviews-Ventes_Rago_Lighthouse-Vente_Klaipeda_County.html",
      "https://bernardinai.lt",
      {
        waitUntil: "load",
        timeout: CONFIG.screenshot.responseTimeoutMs,
      },
    );

    await hideAdsElements(page);
    await applyMediaBlur(page, CONFIG.screenshot.blurLargeMedia);

    await page.screenshot({
      path: path.resolve(__dirname, "response.png"),
    });
    console.log({
      status: await response?.status(),
      url: await page.url(),
      ok: await response?.ok(),
    });
    await browser.close();
  });
