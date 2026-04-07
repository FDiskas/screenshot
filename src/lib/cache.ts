import { join, dirname } from "node:path";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { parse } from "node:url";

const CACHE_DIR = join(process.cwd(), "public", "screenshots");

export const cacheService = {
  getDomain: (url: string): string => {
    const parsed = parse(url);
    const domain = parsed.hostname || "unknown";
    return domain;
  },

  getPath: (url: string, status: number): string => {
    const domain = cacheService.getDomain(url);
    const filename = `${Buffer.from(url).toString('base64').substring(0, 32)}.png`;
    return join(domain, filename);
  },

  save: (url: string, buffer: Buffer, status: number): string => {
    const relativePath = cacheService.getPath(url, status);
    const fullPath = join(CACHE_DIR, relativePath);
    
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, buffer);
    
    return `/screenshots/${relativePath.replace(/\\/g, '/')}`;
  },

  exists: (url: string, status: number): string | null => {
    const relativePath = cacheService.getPath(url, status);
    const fullPath = join(CACHE_DIR, relativePath);
    
    if (existsSync(fullPath)) {
      return `/screenshots/${relativePath.replace(/\\/g, '/')}`;
    }
    return null;
  }
};
