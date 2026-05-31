import { readFile } from "node:fs/promises";
import { reactRenderer } from "@hono/react-renderer";
import { type Context, Hono } from "hono";
import { serveStatic } from "hono/bun";
import type { BlankEnv, BlankInput } from "hono/types";
import { DocsPage } from "./components/DocsPage";
import { LandingPage } from "./components/LandingPage";
import { Layout } from "./components/layout";
import { PrivacyPage } from "./components/PrivacyPage";
import { CONFIG } from "./config";
import { dbService } from "./db";
import { hatchet } from "./lib/hatchet";
import { getStatusPlaceholder } from "./lib/placeholder";
import {
  isValidScreenshotUrl,
  parseScreenshotParams,
  resolveScreenshotDomain,
} from "./lib/request";
import { checkRobotsTxt } from "./lib/robots";
import { checkSafety } from "./lib/safety";
import { CleanupWorkflow } from "./lib/workflows/cleanup.workflow";
import { PurgeWorkflow } from "./lib/workflows/purge.workflow";
import { ScreenshotWorkflow } from "./lib/workflows/screenshot.workflow";

async function startWorker() {
  const worker = await hatchet.worker(CONFIG.worker.name, {
    slots: CONFIG.worker.slots,
  });
  await worker.registerWorkflow(ScreenshotWorkflow);
  await worker.registerWorkflow(CleanupWorkflow);
  await worker.registerWorkflow(PurgeWorkflow);
  await worker.start();
  console.log(
    "Hatchet worker started within server process and listening for screenshot events...",
  );
}
startWorker().catch(console.error);

const app = new Hono();
/** Last time we enqueued a Hatchet screenshot event per domain (debounce / duplicate suppression). */
const recentTriggerByDomain = new Map<string, number>();
const screenshotMaxAgeSeconds = Math.max(
  0,
  Math.floor(CONFIG.cache.maxAgeMs / 1000),
);
const screenshotCacheControl = `public, max-age=${screenshotMaxAgeSeconds}, immutable`;
const triggerMapMaxAgeMs = CONFIG.server.processingRetryMs * 4;

// Periodic memory cleanup — evict stale trigger timestamps so the map does not grow forever.
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [domain, timestamp] of recentTriggerByDomain.entries()) {
    if (now - timestamp > triggerMapMaxAgeMs) {
      recentTriggerByDomain.delete(domain);
    }
  }
  // Aggressive garbage collection to keep Bun memory usage low on idle
  if (typeof Bun !== "undefined" && Bun.gc) {
    Bun.gc(true);
  }
}, triggerMapMaxAgeMs);

// Cleanup interval on process exit to prevent memory leak
const shutdown = () => {
  clearInterval(cleanupInterval);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);

// Static files
app.use("/index.css", serveStatic({ path: "./public/index.css" }));
app.use("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));
app.use("/screenshots/*", async (c, next) => {
  await next();
  if (c.res.ok) {
    c.res.headers.set("Cache-Control", screenshotCacheControl);
  }
});
app.use("/screenshots/*", serveStatic({ root: "./public" }));

// SSR Renderer
type RendererProps = { title?: string; children?: React.ReactNode };
app.use(
  "*",
  reactRenderer(({ children, ...props }: RendererProps) => {
    const title = props.title || CONFIG.server.defaultTitle;
    return <Layout title={title}>{children}</Layout>;
  }),
);

// Routes
app.get("/", (c) => {
  const latest = dbService.getLatest();
  const origin = getRequestOrigin(c);
  return c.render(<LandingPage latest={latest} origin={origin} />, {
    title: CONFIG.server.homeTitle,
  });
});

app.get("/docs", (c) => {
  const origin = getRequestOrigin(c);
  return c.render(<DocsPage origin={origin} />, {
    title: CONFIG.server.docsTitle,
  });
});

function getRequestOrigin(c: Context): string {
  const proto =
    c.req.header("x-forwarded-proto") ||
    new URL(c.req.url).protocol.replace(":", "");
  const host = c.req.header("x-forwarded-host") || c.req.header("host");
  return host ? `${proto}://${host}` : new URL(c.req.url).origin;
}

app.get("/privacy", (c) => {
  return c.render(<PrivacyPage />, {
    title: `Privacy Policy - ${CONFIG.server.defaultTitle}`,
  });
});

async function returnStatusPlaceholder(
  c: Context,
  status: number,
  width: number,
  height: number,
  cacheControl: string,
) {
  const buffer = await getStatusPlaceholder(status, width, height);
  return c.body(new Uint8Array(buffer), 200, {
    "Content-Type": "image/png",
    "Cache-Control": cacheControl,
  });
}

async function handleCacheHit(
  c: Context,
  url: string,
  domain: string,
  width: number,
  height: number,
  cacheMode: "image" | "redirect",
) {
  const existing = dbService.getByUrl(url, width, height);
  if (!existing || existing.status !== 200 || !existing.image_path) {
    return null;
  }

  recentTriggerByDomain.delete(domain);
  if (cacheMode === "redirect") {
    const response = c.redirect(existing.image_path, 302);
    response.headers.set("Cache-Control", screenshotCacheControl);
    return response;
  }

  try {
    const fileBuffer = await readFile(`./public${existing.image_path}`);
    return c.body(new Uint8Array(fileBuffer), 200, {
      "Content-Type": "image/png",
      "Cache-Control": screenshotCacheControl,
    });
  } catch {
    return null;
  }
}

function triggerHatchetEventDebounced(
  domain: string,
  domainUrl: string,
  width: number,
  height: number,
) {
  const now = Date.now();
  const lastTrigger = recentTriggerByDomain.get(domain) || 0;
  const shouldTrigger =
    lastTrigger === 0 || now - lastTrigger > CONFIG.server.processingRetryMs;

  if (shouldTrigger) {
    recentTriggerByDomain.set(domain, now);
    hatchet.events
      .push(CONFIG.server.screenshotEventName, {
        url: domainUrl,
        width,
        height,
      })
      .catch((err) => {
        recentTriggerByDomain.delete(domain);
        console.error("Hatchet trigger error:", err);
      });
  } else {
    const waitMs = CONFIG.server.processingRetryMs - (now - lastTrigger);
    console.info(
      `[screenshot] Skipping duplicate Hatchet event for ${domain}; next eligible in ~${Math.max(0, Math.ceil(waitMs / 1000))}s`,
    );
  }
}

const handleScreenshotRequest = async (
  c: Context<BlankEnv, "/api/screenshot" | "/api/raw", BlankInput>,
  cacheMode: "image" | "redirect",
) => {
  const params = parseScreenshotParams(
    c.req.query("url"),
    c.req.query("width"),
    c.req.query("height"),
  );

  if (!params) {
    return c.text("URL is required", 400);
  }

  const { url, width, height } = params;

  if (!isValidScreenshotUrl(url)) {
    return returnStatusPlaceholder(
      c,
      400,
      width,
      height,
      screenshotCacheControl,
    );
  }

  const resolved = resolveScreenshotDomain(url);
  if (!resolved) {
    return returnStatusPlaceholder(
      c,
      400,
      width,
      height,
      screenshotCacheControl,
    );
  }

  const { domain, domainUrl } = resolved;

  const cachedResponse = await handleCacheHit(
    c,
    url,
    domain,
    width,
    height,
    cacheMode,
  );
  if (cachedResponse) {
    return cachedResponse;
  }

  if (!(await checkSafety(domainUrl))) {
    return returnStatusPlaceholder(
      c,
      403,
      width,
      height,
      screenshotCacheControl,
    );
  }

  if (!(await checkRobotsTxt(domainUrl))) {
    return returnStatusPlaceholder(
      c,
      418,
      width,
      height,
      screenshotCacheControl,
    );
  }

  triggerHatchetEventDebounced(domain, domainUrl, width, height);

  const response = await returnStatusPlaceholder(
    c,
    202,
    width,
    height,
    "no-store, no-cache, must-revalidate",
  );
  response.headers.set(
    "Refresh",
    String(CONFIG.server.processingRefreshSeconds),
  );
  return response;
};

app.get("/api/screenshot", async (c) => {
  return handleScreenshotRequest(c, "image");
});

app.get("/api/raw", async (c) => {
  return handleScreenshotRequest(c, "redirect");
});

async function enqueueReloadTask(
  domain: string,
  domainUrl: string,
  width: number,
  height: number,
): Promise<string | null> {
  recentTriggerByDomain.set(domain, Date.now());
  try {
    await hatchet.events.push(CONFIG.server.screenshotEventName, {
      url: domainUrl,
      width,
      height,
    });
    return null;
  } catch (err) {
    recentTriggerByDomain.delete(domain);
    console.error("Hatchet trigger error:", err);
    return "Failed to enqueue regeneration task";
  }
}

app.get("/api/reload", async (c) => {
  const params = parseScreenshotParams(
    c.req.query("url"),
    c.req.query("width"),
    c.req.query("height"),
  );

  if (!params) {
    return c.json({ error: "URL is required" }, 400);
  }

  const { url, width, height } = params;

  if (!isValidScreenshotUrl(url)) {
    return c.json({ error: "Only HTTPS URLs are supported" }, 400);
  }

  const resolved = resolveScreenshotDomain(url);
  if (!resolved) {
    return c.json({ error: "Invalid URL" }, 400);
  }

  const { domain, domainUrl } = resolved;

  const existing = dbService.getByUrl(url, width, height);
  if (!existing) {
    return c.json({ error: "No cached image found for this URL" }, 404);
  }

  const cachedAge = Date.now() - new Date(existing.created_at).getTime();
  if (cachedAge < CONFIG.server.minReloadAgeMs) {
    const remainingDays = Math.ceil(
      (CONFIG.server.minReloadAgeMs - cachedAge) / (24 * 60 * 60 * 1000),
    );
    return c.json(
      {
        error: `Image is too recent to reload. Try again in ${remainingDays} day(s)`,
      },
      429,
    );
  }

  if (!(await checkSafety(domainUrl))) {
    return c.json({ error: "URL is not allowed" }, 403);
  }

  if (!(await checkRobotsTxt(domainUrl))) {
    return c.json({ error: "Blocked by robots.txt" }, 403);
  }

  const error = await enqueueReloadTask(domain, domainUrl, width, height);
  if (error) {
    return c.json({ error }, 500);
  }

  return c.json({ status: "queued", url: domainUrl, width, height });
});

console.log(`Server starting on port ${CONFIG.server.port}...`);

export default {
  port: CONFIG.server.port,
  fetch: app.fetch,
};
