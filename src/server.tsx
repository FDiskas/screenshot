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

const app = new Hono();

// Static files
app.use("/index.css", serveStatic({ path: "./src/index.css" }));
app.use("/screenshots/*", serveStatic({ root: "./public" }));

// SSR Renderer
app.use(
  "*",
  reactRenderer(({ children, ...props }) => {
    const title = (props as any).title || "SnapService - Quick URL Screenshots";
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
  
  return c.render(<LandingPage latest={latest} origin={origin} />, { title: "SnapService | Home" });
});

app.get("/docs", (c) => {
  const proto = c.req.header("x-forwarded-proto") || new URL(c.req.url).protocol.replace(":", "");
  const host = c.req.header("x-forwarded-host") || c.req.header("host");
  const origin = host ? `${proto}://${host}` : new URL(c.req.url).origin;
  
  return c.render(<DocsPage origin={origin} />, { title: "SnapService | Documentation" });
});

app.get("/api/screenshot", async (c) => {
  const url = c.req.query("url");
  const width = parseInt(c.req.query("width") || "387");
  const height = parseInt(c.req.query("height") || "217");

  if (!url) {
    return c.text("URL is required", 400);
  }

  // 1. Basic validation
  if (!url.startsWith("https://")) {
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
    } else {
      // Return placeholder (processing or broken)
      const placeholder = await getStatusPlaceholder(existing.status, width, height);
      const headers: Record<string, string> = { "Content-Type": "image/png" };
      
      // ONLY add Refresh header if it's currently processing (202)
      if (existing.status === 202) {
        headers["Refresh"] = "5";
      }
      
      return c.body(new Uint8Array(placeholder), 200, headers);
    }
  }

  // 3. Safety Check
  const isSafe = await checkSafety(url);
  if (!isSafe) {
    const unsafePlaceholder = await getStatusPlaceholder(403, width, height);
    return c.body(new Uint8Array(unsafePlaceholder), 200, { "Content-Type": "image/png" });
  }

  // 4. Async process and return placeholder
  // Record that we are processing immediately so subsequent refreshes see it
  const domain = cacheService.getDomain(url);
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  const expiresAt = oneMonthFromNow.toISOString().slice(0, 19).replace('T', ' ');

  dbService.add({
    url,
    domain,
    status: 202,
    image_path: null,
    expires_at: expiresAt
  });

  // We trigger Hatchet event instead of direct worker call
  hatchet.events.push("screenshot:create", {
    url,
    width,
    height
  }).catch(err => console.error("Hatchet trigger error:", err));

  const processingPlaceholder = await getStatusPlaceholder(202, width, height);
  return c.body(new Uint8Array(processingPlaceholder), 200, { 
    "Content-Type": "image/png",
    "Refresh": "5" // Auto-refresh in 5 seconds
  });
});

console.log(`Server starting on port ${app.fetch.toString().includes('3001') ? 3001 : 3001}...`); // Dynamic or generic log

export default {
  port: 3001,
  fetch: app.fetch,
};
