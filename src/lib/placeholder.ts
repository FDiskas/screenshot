import "./sharp-config";
import sharp from "sharp";

import { CONFIG } from "../config";

const buildPlaceholderSvg = (
  text: string,
  width: number,
  height: number,
): string =>
  `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="20" fill="#6b7280">${text}</text>
    </svg>`;

export const generatePlaceholder = async (
  text: string,
  width: number = CONFIG.placeholder.defaultWidth,
  height: number = CONFIG.placeholder.defaultHeight,
): Promise<Buffer> => {
  const svg = buildPlaceholderSvg(text, width, height);
  return sharp(Buffer.from(svg)).png().toBuffer();
};

// ─── Pre-rendered cache ───────────────────────────────────────────────────────
// Placeholder images for common statuses at default dimensions are immutable;
// generate them once at startup and reuse the buffer on every request.
// This avoids repeatedly spinning up libvips via Sharp for the hot path.

type CacheKey = `${number}:${number}:${number}`;

const placeholderCache = new Map<CacheKey, Buffer>();

const cacheKey = (status: number, width: number, height: number): CacheKey =>
  `${status}:${width}:${height}`;

const WARM_STATUSES = [202, 400, 403] as const;
const { defaultWidth: DW, defaultHeight: DH } = CONFIG.placeholder;

// Warm the cache synchronously at import time (sharp itself is async, so we
// store the Promise and then flush it on first use via the async helper below).
const warmupPromise: Promise<void> = (async () => {
  await Promise.all(
    WARM_STATUSES.map(async (status) => {
      const text =
        status === 202
          ? CONFIG.placeholder.textByStatus.processing
          : status === 400
            ? CONFIG.placeholder.textByStatus.invalidUrl
            : CONFIG.placeholder.textByStatus.unsafeSite;

      const buf = await sharp(Buffer.from(buildPlaceholderSvg(text, DW, DH)))
        .png()
        .toBuffer();
      placeholderCache.set(cacheKey(status, DW, DH), buf);
    }),
  );
})();

export const getStatusPlaceholder = async (
  status: number,
  width: number = DW,
  height: number = DH,
): Promise<Buffer> => {
  // Ensure warmup finished (no-op after the first await resolves)
  await warmupPromise;

  const key = cacheKey(status, width, height);
  const cached = placeholderCache.get(key);
  if (cached) return cached;

  // Non-default dimensions or uncommon status — generate, then cache.
  let text = `Status: ${status}`;
  if (status === 202) text = CONFIG.placeholder.textByStatus.processing;
  if (status === 400) text = CONFIG.placeholder.textByStatus.invalidUrl;
  if (status === 403) text = CONFIG.placeholder.textByStatus.unsafeSite;

  const buf = await generatePlaceholder(text, width, height);
  // Only cache default dimensions — arbitrary query-param sizes would grow the
  // Map without bound since there is no eviction policy.
  if (width === DW && height === DH) {
    placeholderCache.set(key, buf);
  }
  return buf;
};
