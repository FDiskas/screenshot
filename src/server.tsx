import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { reactRenderer } from "@hono/react-renderer";
import { Layout } from "./components/layout";
import { LandingPage } from "./components/LandingPage";
import { dbService } from "./db";
import { checkSafety } from "./lib/safety";
import { processScreenshot } from "./lib/worker";
import { getStatusPlaceholder } from "./lib/placeholder";
import { cacheService } from "./lib/cache";

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
  return c.render(<LandingPage latest={latest} />, { title: "SnapService | Home" });
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
  // We don't await processScreenshot
  processScreenshot(url, width, height).catch(err => console.error("Worker error:", err));

  const processingPlaceholder = await getStatusPlaceholder(202, width, height);
  return c.body(new Uint8Array(processingPlaceholder), 200, { 
    "Content-Type": "image/png",
    "Refresh": "5" // Auto-refresh in 5 seconds
  });
});

console.log("Server running at http://localhost:3001");

export default {
  port: 3001,
  fetch: app.fetch,
};
