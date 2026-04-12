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
    defaultWidth: 480,
    defaultHeight: 270,
    desktopViewportWidth: 1280,
    desktopViewportHeight: 720,
    pageZoomPercent: 120,
    emulatedColorScheme: "dark",
    responseTimeoutMs: 15_000,
    pageSettleMs: 1_500,
    browserLaunchArgs: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      // Some sites fail headless navigation with ERR_HTTP2_PROTOCOL_ERROR.
      // Force HTTP/1.1 fallback to improve screenshot reliability.
      "--disable-http2",
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
      blurPx: 9,
      blurVisibleMediaInViewport: true,
    },
    dns: {
      enabled: true,
      /** When false, Chromium still uses configured DoH but skips JSON preflight and test.nextdns.io verification. */
      checkDnsStatus: true,
      verboseLogging: false,
      providerName: "NextDNS",
      preflightJsonEndpoint: "https://364ec7.dns.nextdns.io",
      browserDohTemplate: "https://364ec7.dns.nextdns.io/dns-query{?dns}",
      expectedProfileId: "364ec7",
      verificationEndpoint: "https://test.nextdns.io",
      enforceProfileMatch: false,
      preflightLookupTimeoutMs: 2_000,
    },
  },
  cache: {
    rootDir: ["public", "screenshots"] as const,
    maxAgeMs: 30 * 24 * 60 * 60 * 1000,
    imageExtension: ".png",
    filenameDatePattern: /^(\d{8}T\d{6}Z)-[a-f0-9]{8}\.png$/i,
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
      unsafeSite: "Unsafe Site",
    },
  },
  retention: {
    months: 1,
  },
} as const;
