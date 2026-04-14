/**
 * Central Sharp configuration module.
 * Import this once (side-effect import) before any other sharp usage.
 * All settings here are process-wide.
 */
import sharp from "sharp";

// Guard against test environments where sharp is mocked as a plain callable
// without `.cache`/`.concurrency` methods.
if (typeof sharp.cache === "function") {
  // Disable libvips internal tile cache — we manage our own output buffering.
  sharp.cache(false);
}
if (typeof sharp.concurrency === "function") {
  // Single libvips worker thread is sufficient for a 1-slot Hatchet worker.
  sharp.concurrency(1);
}
