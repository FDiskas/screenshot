import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { reactRenderer } from "@hono/react-renderer";
import { Layout } from "./components/layout";
import { LandingPage } from "./components/LandingPage";
import { DocsPage } from "./components/DocsPage";
import { dbService } from "./db";
import { checkSafety } from "./lib/safety";
import { getStatusPlaceholder } from "./lib/placeholder";
import { cacheService } from "./lib/cache";
import { hatchet } from "./lib/hatchet";
import { CONFIG } from "./config";

const app = new Hono();
const recentTriggerByDomain = new Map<string, number>();

// Static files
app.use("/index.css", serveStatic({ path: "./src/index.css" }));
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

app.get("/api/screenshot", async (c) => {
  const url = c.req.query("url");
  const width = parseInt(c.req.query("width") || String(CONFIG.screenshot.defaultWidth));
  const height = parseInt(c.req.query("height") || String(CONFIG.screenshot.defaultHeight));

  if (!url) {
    return c.text("URL is required", 400);
  }

  // 1. Basic validation
  if (!url.startsWith("https://")) {
    const errorBuffer = await getStatusPlaceholder(400, width, height);
    return c.body(new Uint8Array(errorBuffer), 200, { "Content-Type": "image/png" });
  }

  let domain: string;
  let domainUrl: string;
  try {
    domain = cacheService.getDomain(url);
    domainUrl = cacheService.getDomainUrl(url);
  } catch {
    const errorBuffer = await getStatusPlaceholder(400, width, height);
    return c.body(new Uint8Array(errorBuffer), 200, { "Content-Type": "image/png" });
  }

  // 2. Check Cache
  const existing = dbService.getByUrl(url);
  if (existing) {
    if (existing.status === 200 && existing.image_path) {
      // Return cached image
      const file = Bun.file(`./public${existing.image_path}`);
      if (await file.exists()) {
        return new Response(file);
      }
    }
  }

  // 3. Safety Check
  const isSafe = await checkSafety(domainUrl);
  if (!isSafe) {
    const unsafePlaceholder = await getStatusPlaceholder(403, width, height);
    return c.body(new Uint8Array(unsafePlaceholder), 200, { "Content-Type": "image/png" });
  }

  // 4. Async process and return placeholder
  const now = Date.now();
  const lastTrigger = recentTriggerByDomain.get(domain) || 0;
  const shouldTrigger = now - lastTrigger > CONFIG.server.processingRetryMs;

  if (shouldTrigger) {
    recentTriggerByDomain.set(domain, now);
    hatchet.events.push(CONFIG.server.screenshotEventName, {
      url: domainUrl,
      width,
      height
    }).catch(err => console.error("Hatchet trigger error:", err));
  }

  const processingPlaceholder = await getStatusPlaceholder(202, width, height);
  return c.body(new Uint8Array(processingPlaceholder), 200, { 
    "Content-Type": "image/png",
    "Refresh": String(CONFIG.server.processingRefreshSeconds)
  });
});

console.log(`Server starting on port ${CONFIG.server.port}...`);

export default {
  port: CONFIG.server.port,
  fetch: app.fetch,
};
