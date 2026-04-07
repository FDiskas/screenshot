export const CONFIG = {
  server: {
    port: 3001,
    defaultTitle: "SnapService - Quick URL Screenshots",
    homeTitle: "SnapService | Home",
    docsTitle: "SnapService | Documentation",
    processingRetryMs: 30_000,
    processingRefreshSeconds: 5,
    screenshotEventName: "screenshot:create",
  },
  screenshot: {
    defaultWidth: 480,
    defaultHeight: 270,
    desktopViewportWidth: 1920,
    desktopViewportHeight: 1080,
    emulatedColorScheme: "dark",
    responseTimeoutMs: 5_000,
    browserLaunchArgs: ["--no-sandbox", "--disable-setuid-sandbox"] as string[],
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
      blurPx: 18,
      blurVisibleMediaInViewport: true,
    },
    dns: {
      enabled: true,
      providerName: "NextDNS",
      preflightJsonEndpoint: "https://dns.nextdns.io/364ec7",
      browserDohTemplate: "https://dns.nextdns.io/364ec7{?dns}",
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
