import puppeteer from "puppeteer-extra";
import Adblocker from "puppeteer-extra-plugin-adblocker";
import { applySmartBlocker } from "../src/lib/block-scripts";
import path from "node:path";
import { CONFIG } from "../src/config";
import { hideAdsElements } from "../src/lib/hide-ads";
import { applyMediaBlur } from "../src/lib/screenshot-blur";

puppeteer.use(
  Adblocker({
    blockTrackers: true,
    blockTrackersAndAnnoyances: true,
    useCache: false,
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
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  })
  .then(async (browser) => {
    const page = await browser.newPage();

    await applySmartBlocker(page);

    await page.setViewport({ width: 1280, height: 800 });

    const hints = CONFIG.screenshot.browserUserAgentClientHints;
    await page.setUserAgent({
      userAgent: CONFIG.screenshot.browserUserAgent,
      userAgentMetadata: JSON.parse(JSON.stringify(hints)),
    });

    await page.goto("https://www.bernardinai.lt/", {
      waitUntil: "networkidle0",
    });

    await hideAdsElements(page);
    await applyMediaBlur(page, CONFIG.screenshot.blurLargeMedia);

    // await page.waitForNetworkIdle({
    //   //   idleTime: 1000,
    //   timeout: 30000,
    // });

    await page.screenshot({
      path: path.resolve(__dirname, "response.png"),
    });
    await browser.close();
  });
