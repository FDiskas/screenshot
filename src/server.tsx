import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { reactRenderer } from "@hono/react-renderer";
import { readFile } from "node:fs/promises";
import { Layout } from "./components/layout";
import { LandingPage } from "./components/LandingPage";
import { DocsPage } from "./components/DocsPage";
import { dbService } from "./db";
import { checkSafety } from "./lib/safety";
import { getStatusPlaceholder } from "./lib/placeholder";
import { parseScreenshotParams, isValidScreenshotUrl, resolveScreenshotDomain } from "./lib/request";
import { hatchet } from "./lib/hatchet";
import { CONFIG } from "./config";
import { ScreenshotWorkflow } from "./lib/workflows/screenshot.workflow";
import { CleanupWorkflow } from "./lib/workflows/cleanup.workflow";
import { PurgeWorkflow } from "./lib/workflows/purge.workflow";

async function startWorker() {
  const worker = await hatchet.worker(CONFIG.worker.name, {
    slots: CONFIG.worker.slots,
  });
  await worker.registerWorkflow(ScreenshotWorkflow);
  await worker.registerWorkflow(CleanupWorkflow);
  await worker.registerWorkflow(PurgeWorkflow);
  await worker.start();
  console.log("Hatchet worker started within server process and listening for screenshot events...");
}
startWorker().catch(console.error);

const app = new Hono();
const recentTriggerByDomain = new Map<string, number>();
const pendingTriggerByDomain = new Map<string, number>();
const screenshotMaxAgeSeconds = Math.max(
  0,
  Math.floor(CONFIG.cache.maxAgeMs / 1000),
);
const screenshotCacheControl = `public, max-age=${screenshotMaxAgeSeconds}, immutable`;
const pendingTriggerMaxAgeMs = CONFIG.server.processingRetryMs * 4;

// Periodic memory cleanup
setInterval(() => {
  const now = Date.now();
  const expireMs = 10 * 60 * 1000; // 10 minutes

  for (const [domain, timestamp] of recentTriggerByDomain.entries()) {
    if (now - timestamp > expireMs) {
      recentTriggerByDomain.delete(domain);
    }
  }

  for (const [domain, timestamp] of pendingTriggerByDomain.entries()) {
    if (now - timestamp > expireMs) {
      pendingTriggerByDomain.delete(domain);
    }
  }

  // Aggressive garbage collection to keep Bun memory usage low on idle
  if (typeof Bun !== "undefined" && Bun.gc) {
    Bun.gc(true);
  }
}, 60_000);

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
app.use(
  "*",
  reactRenderer(({ children, ...props }) => {
    const title = (props as any).title || CONFIG.server.defaultTitle;
    return <Layout title={title}>{children}</Layout>;
  })
);

// Routes
app.get("/", (c) => {
  const latest = dbService.getLatest();
  // Better origin detection
  const proto = c.req.header("x-forwarded-proto") || new URL(c.req.url).protocol.replace(":", "");
  const host = c.req.header("x-forwarded-host") || c.req.header("host");
  const origin = host ? `${proto}://${host}` : new URL(c.req.url).origin;
  
  return c.render(<LandingPage latest={latest} origin={origin} />, { title: CONFIG.server.homeTitle });
});

app.get("/docs", (c) => {
  const proto = c.req.header("x-forwarded-proto") || new URL(c.req.url).protocol.replace(":", "");
  const host = c.req.header("x-forwarded-host") || c.req.header("host");
  const origin = host ? `${proto}://${host}` : new URL(c.req.url).origin;
  
  return c.render(<DocsPage origin={origin} />, { title: CONFIG.server.docsTitle });
});

const handleScreenshotRequest = async (
  c: any,
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
      pendingTriggerByDomain.delete(domain);
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
  const pendingSince = pendingTriggerByDomain.get(domain) || 0;
  const hasPendingTrigger =
    pendingSince > 0 && now - pendingSince < pendingTriggerMaxAgeMs;
  const lastTrigger = recentTriggerByDomain.get(domain) || 0;
  const shouldTrigger =
    !hasPendingTrigger &&
    now - lastTrigger > CONFIG.server.processingRetryMs;

  if (shouldTrigger) {
    recentTriggerByDomain.set(domain, now);
    pendingTriggerByDomain.set(domain, now);
    hatchet.events.push(CONFIG.server.screenshotEventName, {
      url: domainUrl,
      width,
      height
    }).catch(err => {
      pendingTriggerByDomain.delete(domain);
      console.error("Hatchet trigger error:", err);
    });
  }

  const processingPlaceholder = await getStatusPlaceholder(202, width, height);
  return c.body(new Uint8Array(processingPlaceholder), 200, { 
    "Content-Type": "image/png",
    "Refresh": String(CONFIG.server.processingRefreshSeconds),
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
    const remainingDays = Math.ceil((CONFIG.server.minReloadAgeMs - cachedAge) / (24 * 60 * 60 * 1000));
    return c.json({ error: `Image is too recent to reload. Try again in ${remainingDays} day(s)` }, 429);
  }

  const isSafe = await checkSafety(domainUrl);
  if (!isSafe) {
    return c.json({ error: "URL is not allowed" }, 403);
  }

  recentTriggerByDomain.set(domain, Date.now());
  pendingTriggerByDomain.set(domain, Date.now());

  try {
    await hatchet.events.push(CONFIG.server.screenshotEventName, {
      url: domainUrl,
      width,
      height,
    });
  } catch (err) {
    pendingTriggerByDomain.delete(domain);
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
