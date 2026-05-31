export const CONFIG = {
  server: {
    port: 3001,
    defaultTitle: "SnapService - Quick URL Screenshots",
    homeTitle: "SnapService | Home",
    docsTitle: "SnapService | Documentation",
    processingRetryMs: 30_000,
    processingRefreshSeconds: 5,
    screenshotEventName: "screenshot:create",
    minReloadAgeMs: 10 * 24 * 60 * 60 * 1000,
  },
  screenshot: {
    allowedResolutions: [
      { width: 320, height: 568 },
      { width: 360, height: 800 },
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 414, height: 896 },
      { width: 430, height: 932 },
      { width: 480, height: 270 },
      { width: 1280, height: 720 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1920, height: 1080 },
    ],
    defaultWidth: 480,
    defaultHeight: 270,
    desktopViewportWidth: 1280,
    desktopViewportHeight: 720,
    pageZoomPercent: 120,
    emulatedColorScheme: "dark",
    responseTimeoutMs: 15_000,
    pageSettleMs: 3_000,
    /** Time budget to find and click common CMP “accept” buttons before CSS consent hiding. */
    consentClickBudgetMs: 8_000,
    /** Max time to wait for the URL to stop changing after `goto` (client-side redirects). */
    redirectSettleMaxMs: 8_000,
    /** How long the URL must stay unchanged before we consider navigation settled. */
    redirectSettleStableMs: 450,
    /**
     * Headless Chromium’s default User-Agent string is truncated (no Chrome/… Safari/…),
     * which many WAFs treat as a bot and answer with HTTP 403.
     */
    browserUserAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    /**
     * Must align with browserUserAgent (Chrome major + Windows) so Sec-CH-UA / UA-CH match.
     * Helps sites (e.g. Reddit) that reject mismatched or automation-only clients with HTTP 403.
     */
    browserUserAgentClientHints: {
      brands: [
        { brand: "Google Chrome", version: "146" },
        { brand: "Chromium", version: "146" },
        { brand: "Not_A Brand", version: "24" },
      ],
      fullVersion: "146.0.0.0",
      fullVersionList: [
        { brand: "Google Chrome", version: "146.0.0.0" },
        { brand: "Chromium", version: "146.0.0.0" },
        { brand: "Not_A Brand", version: "24.0.0.0" },
      ],
      platform: "Windows",
      platformVersion: "15.0.0",
      architecture: "x86",
      bitness: "64",
      wow64: false,
      model: "",
      mobile: false,
    },
    browserLaunchArgs: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      // Reduces obvious automation signals (helps Reddit, Cloudflare, etc.).
      "--disable-blink-features=AutomationControlled",
      // Some sites fail headless navigation with ERR_HTTP2_PROTOCOL_ERROR.
      // Force HTTP/1.1 fallback to improve screenshot reliability.
      // "--disable-http2",
    ] as string[],
    allowedProtocol: "https://",
    resize: {
      fit: "contain",
      background: "#ffffff",
      position: "center",
      withoutEnlargement: false,
    },
    blurLargeMedia: {
      enabled: true,
      selector:
        'picture, img, video, canvas, svg, figure, [style*="background-image"]',
      minWidthPx: 160,
      minHeightPx: 90,
      minAreaPx: 12_000,
      minIntrinsicAreaPx: 12_000,
      blurPx: 5,
      blurVisibleMediaInViewport: true,
    },
  },
  cache: {
    rootDir: ["public", "screenshots"] as const,
    maxAgeMs: 30 * 24 * 60 * 60 * 1000,
    imageExtension: ".png",
    filenameDatePattern: /^(\d{8}T\d{6}Z)-[a-f0-9]{8}(?:-(\d+)x(\d+))?\.png$/i,
    fallbackTld: "other",
  },
  safety: {
    apiBaseUrl: "https://is.coders.lt",
  },
  worker: {
    name: "screenshot-worker",
    slots: 1,
  },
  workflows: {
    screenshot: {
      name: "screenshot-workflow",
      taskName: "process-screenshot",
    },
    cleanup: {
      name: "cleanup-workflow",
      taskName: "run-cleanup-task",
      cron: "0 0 * * *",
    },
    purge: {
      name: "purge-workflow",
      taskName: "run-purge-task",
    },
  },
  placeholder: {
    defaultWidth: 387,
    defaultHeight: 217,
    textByStatus: {
      processing: "Processing...",
      invalidUrl: "Invalid URL",
      restricted: "Restricted Content",
      unsafeSite: "Unsafe Site",
      dissallowed: "Dissallowed",
    },
  },
  retention: {
    months: 1,
  },
} as const;
