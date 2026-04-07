import puppeteer from "puppeteer";
import sharp from "sharp";

export interface ScreenshotOptions {
  url: string;
  width?: number;
  height?: number;
}

export interface ScreenshotResult {
  buffer: Buffer | null;
  status: number;
  error?: string;
  finalUrl?: string;
}

export const captureScreenshot = async (options: ScreenshotOptions): Promise<ScreenshotResult> => {
  const { url, width = 387, height = 217 } = options;

  let browser;
  try {
    // Only allow HTTPS
    if (!url.startsWith('https://')) {
      return { buffer: null, status: 400, error: "Only HTTPS URLs are allowed" };
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // Set a desktop-sized viewport to trigger desktop layouts
    await page.setViewport({ width: 1280, height: 720 });

    const response = await page.goto(url, {
      waitUntil: 'load', // Initial load
      timeout: 30000
    });

    // Wait a bit more for some dynamic content to settle (important for heavy sites like YouTube)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Hide common cookie/consent banners to get a cleaner screenshot
    await page.addStyleTag({
      content: `
        [id*="cookie" i], [class*="cookie" i], 
        [id*="consent" i], [class*="consent" i],
        [id*="banner" i], [class*="banner" i],
        [id*="cmp-" i], [class*="cmp-" i],
        #onetrust-banner-sdk, .ot-sdk-container,
        [aria-label*="cookie" i], [aria-label*="consent" i] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `
    });

    if (!response) {
      return { buffer: null, status: 500, error: "Failed to load page" };
    }

    const status = response.status();
    const finalUrl = page.url();

    if (status !== 200) {
      return { buffer: null, status, finalUrl };
    }

    // Take screenshot of the desktop viewport
    const rawBuffer = await page.screenshot({ type: 'png' }) as Buffer;

    // Resize to the desired dimensions (296x166)
    const resizedBuffer = await sharp(rawBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'top' // Focus on the top part of the site
      })
      .toBuffer();

    return { buffer: resizedBuffer, status, finalUrl };

  } catch (error: any) {
    console.error(`Puppeteer error for ${url}:`, error.message);
    
    // Handle certificate errors specifically if possible
    if (error.message.includes('ERR_CERT_AUTHORITY_INVALID') || error.message.includes('SSL certificate error')) {
      return { buffer: null, status: 495, error: "Invalid SSL certificate" }; 
    }

    return { buffer: null, status: 500, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
