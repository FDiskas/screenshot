import { readFile } from "node:fs/promises";
import { reactRenderer } from "@hono/react-renderer";
import { type Context, Hono } from "hono";
import { serveStatic } from "hono/bun";
import type { BlankEnv, BlankInput } from "hono/types";
import { DocsPage } from "./components/DocsPage";
import { LandingPage } from "./components/LandingPage";
import { Layout } from "./components/layout";
import { CONFIG } from "./config";
import { dbService } from "./db";
import { hatchet } from "./lib/hatchet";
import { getStatusPlaceholder } from "./lib/placeholder";
import {
  isValidScreenshotUrl,
  parseScreenshotParams,
  resolveScreenshotDomain,
} from "./lib/request";
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
setInterval(() => {
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
  // Better origin detection
  const proto =
    c.req.header("x-forwarded-proto") ||
    new URL(c.req.url).protocol.replace(":", "");
  const host = c.req.header("x-forwarded-host") || c.req.header("host");
  const origin = host ? `${proto}://${host}` : new URL(c.req.url).origin;

  return c.render(<LandingPage latest={latest} origin={origin} />, {
    title: CONFIG.server.homeTitle,
  });
});

app.get("/docs", (c) => {
  const proto =
    c.req.header("x-forwarded-proto") ||
    new URL(c.req.url).protocol.replace(":", "");
  const host = c.req.header("x-forwarded-host") || c.req.header("host");
  const origin = host ? `${proto}://${host}` : new URL(c.req.url).origin;

  return c.render(<DocsPage origin={origin} />, {
    title: CONFIG.server.docsTitle,
  });
});

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

  // 1. Basic validation
  if (!isValidScreenshotUrl(url)) {
    const errorBuffer = await getStatusPlaceholder(400, width, height);
    return c.body(new Uint8Array(errorBuffer), 200, {
      "Content-Type": "image/png",
      "Cache-Control": screenshotCacheControl,
    });
  }

  const resolved = resolveScreenshotDomain(url);
  if (!resolved) {
    const errorBuffer = await getStatusPlaceholder(400, width, height);
    return c.body(new Uint8Array(errorBuffer), 200, {
      "Content-Type": "image/png",
      "Cache-Control": screenshotCacheControl,
    });
  }

  const { domain, domainUrl } = resolved;

  // 2. Check Cache
  const existing = dbService.getByUrl(url);
  if (existing) {
    if (existing.status === 200 && existing.image_path) {
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
        // File does not exist or cannot be read; continue to recapture path.
      }
    }
  }

  // 3. Safety Check
  const isSafe = await checkSafety(domainUrl);
  if (!isSafe) {
    const unsafePlaceholder = await getStatusPlaceholder(403, width, height);
    return c.body(new Uint8Array(unsafePlaceholder), 200, {
      "Content-Type": "image/png",
      "Cache-Control": screenshotCacheControl,
    });
  }

  // 4. Async process and return placeholder
  const now = Date.now();
  const lastTrigger = recentTriggerByDomain.get(domain) || 0;
  // Debounce only: avoid enqueueing duplicate events while a previous trigger is still "fresh".
  // (Previously a second "pending" window blocked new events for 4× this interval — users saw 202
  // placeholders but no new Hatchet task for up to two minutes.)
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

  const processingPlaceholder = await getStatusPlaceholder(202, width, height);
  return c.body(new Uint8Array(processingPlaceholder), 200, {
    "Content-Type": "image/png",
    Refresh: String(CONFIG.server.processingRefreshSeconds),
    "Cache-Control": "no-store, no-cache, must-revalidate",
  });
};

app.get("/api/screenshot", async (c) => {
  return handleScreenshotRequest(c, "image");
});

app.get("/api/raw", async (c) => {
  return handleScreenshotRequest(c, "redirect");
});

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

  const existing = dbService.getByUrl(url);
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

  const isSafe = await checkSafety(domainUrl);
  if (!isSafe) {
    return c.json({ error: "URL is not allowed" }, 403);
  }

  recentTriggerByDomain.set(domain, Date.now());

  try {
    await hatchet.events.push(CONFIG.server.screenshotEventName, {
      url: domainUrl,
      width,
      height,
    });
  } catch (err) {
    recentTriggerByDomain.delete(domain);
    console.error("Hatchet trigger error:", err);
    return c.json({ error: "Failed to enqueue regeneration task" }, 500);
  }

  return c.json({ status: "queued", url: domainUrl, width, height });
});

console.log(`Server starting on port ${CONFIG.server.port}...`);

export default {
  port: CONFIG.server.port,
  fetch: app.fetch,
};
