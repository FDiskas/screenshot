import { createHash } from "node:crypto";
import { CONFIG } from "../config";
import { cacheService } from "../lib/cache";

export interface ScreenshotRecord {
  id: number;
  url: string;
  domain: string;
  status: number;
  image_path: string | null;
  created_at: string;
  expires_at: string;
}

const toSqlDate = (date: Date): string => {
  return date.toISOString().slice(0, 19).replace("T", " ");
};

const addOneMonth = (date: Date): Date => {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + CONFIG.retention.months);
  return copy;
};

const toRecord = (shot: {
  domain: string;
  imagePath: string;
  createdAt: string;
}): ScreenshotRecord => {
  const created = new Date(shot.createdAt);
  const idHex = createHash("sha1")
    .update(`${shot.domain}-${shot.createdAt}`)
    .digest("hex")
    .slice(0, 8);

  return {
    id: parseInt(idHex, 16),
    url: `https://${shot.domain}`,
    domain: shot.domain,
    status: 200,
    image_path: shot.imagePath,
    created_at: toSqlDate(created),
    expires_at: toSqlDate(addOneMonth(created)),
  };
};

export const dbService = {
  getLatest: (limit = 9): ScreenshotRecord[] => {
    return cacheService.listLatestByDomain(limit).map(toRecord);
  },

  getByUrl: (
    url: string,
    width?: number,
    height?: number,
  ): ScreenshotRecord | undefined => {
    const domain = cacheService.getDomain(url);
    const latest = cacheService.getLatestForDomain(domain, width, height);
    return latest ? toRecord(latest) : undefined;
  },

  cleanup: () => {
    return cacheService.cleanupExpired();
  },

  purgeAll: () => {
    cacheService.purgeAll();
  },
};
