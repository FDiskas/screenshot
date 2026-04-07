import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import {
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { CONFIG } from "../config";

const CACHE_DIR = join(process.cwd(), ...CONFIG.cache.rootDir);

export interface DomainShot {
  domain: string;
  imagePath: string;
  createdAt: string;
}

const toWebPath = (filePath: string): string => {
  return filePath.replace(/\\/g, "/");
};

const listDirs = (dirPath: string): string[] => {
  try {
    return readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
};

const listFiles = (dirPath: string): string[] => {
  try {
    return readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
};

const parseCreatedAt = (filename: string): Date | undefined => {
  const match = filename.match(CONFIG.cache.filenameDatePattern);
  if (!match) {
    return undefined;
  }

  const token = match[1];
  const iso = `${token.slice(0, 4)}-${token.slice(4, 6)}-${token.slice(6, 8)}T${token.slice(9, 11)}:${token.slice(11, 13)}:${token.slice(13, 15)}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
};

const isExpired = (createdAt: Date): boolean => {
  return Date.now() - createdAt.getTime() > CONFIG.cache.maxAgeMs;
};

const removeEmptyParents = (startDir: string) => {
  const screenshotsRoot = CACHE_DIR;
  let current = startDir;

  while (current.startsWith(screenshotsRoot)) {
    const hasChildren =
      listDirs(current).length > 0 || listFiles(current).length > 0;
    if (hasChildren || current === screenshotsRoot) {
      break;
    }
    rmSync(current, { recursive: true, force: true });
    current = dirname(current);
  }
};

const encodeTimestamp = (date: Date): string => {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
};

export const cacheService = {
  getDomain: (url: string): string => {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  },

  getDomainUrl: (url: string): string => {
    return `https://${cacheService.getDomain(url)}`;
  },

  getTld: (domain: string): string => {
    const parts = domain.split(".").filter(Boolean);
    return parts[parts.length - 1] || CONFIG.cache.fallbackTld;
  },

  getDomainRelativeDir: (domain: string): string => {
    const tld = cacheService.getTld(domain);
    return join(tld, domain);
  },

  getPath: (domain: string, createdAt: Date): string => {
    const token = encodeTimestamp(createdAt);
    const unique = createHash("sha1")
      .update(`${domain}-${Date.now()}-${Math.random()}`)
      .digest("hex")
      .slice(0, 8);
    return join(
      cacheService.getDomainRelativeDir(domain),
      `${token}-${unique}${CONFIG.cache.imageExtension}`,
    );
  },

  save: (url: string, buffer: Buffer): string => {
    const domain = cacheService.getDomain(url);
    const relativePath = cacheService.getPath(domain, new Date());
    const fullPath = join(CACHE_DIR, relativePath);

    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, buffer);

    return `/screenshots/${relativePath.replace(/\\/g, "/")}`;
  },

  getLatestForDomain: (domain: string): DomainShot | null => {
    const domainDir = join(
      CACHE_DIR,
      cacheService.getDomainRelativeDir(domain),
    );
    const files = listFiles(domainDir).filter((name) =>
      name.endsWith(CONFIG.cache.imageExtension),
    );
    const valid: { filename: string; createdAt: Date }[] = [];

    for (const filename of files) {
      const parsed = parseCreatedAt(filename);
      if (!parsed) {
        rmSync(join(domainDir, filename), { force: true });
        continue;
      }
      if (isExpired(parsed)) {
        rmSync(join(domainDir, filename), { force: true });
        continue;
      }
      valid.push({ filename, createdAt: parsed });
    }

    if (valid.length === 0) {
      removeEmptyParents(domainDir);
      return null;
    }

    valid.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const latest = valid[0];
    return {
      domain,
      createdAt: latest.createdAt.toISOString(),
      imagePath: `/screenshots/${toWebPath(join(cacheService.getDomainRelativeDir(domain), latest.filename))}`,
    };
  },

  listLatestByDomain: (limit = 9): DomainShot[] => {
    const tldDirs = listDirs(CACHE_DIR);
    const collected: DomainShot[] = [];

    for (const tld of tldDirs) {
      const tldPath = join(CACHE_DIR, tld);
      const domainDirs = listDirs(tldPath);
      for (const domain of domainDirs) {
        const latest = cacheService.getLatestForDomain(domain);
        if (latest) {
          collected.push(latest);
        }
      }
    }

    return collected
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  },

  cleanupExpired: (): { deleted: number } => {
    const tldDirs = listDirs(CACHE_DIR);
    let deleted = 0;

    for (const tld of tldDirs) {
      const tldPath = join(CACHE_DIR, tld);
      const domainDirs = listDirs(tldPath);
      for (const domain of domainDirs) {
        const domainDir = join(tldPath, domain);
        const files = listFiles(domainDir).filter((name) =>
          name.endsWith(CONFIG.cache.imageExtension),
        );
        for (const filename of files) {
          const filePath = join(domainDir, filename);
          const parsed = parseCreatedAt(filename);
          const createdAt = parsed ?? statSync(filePath).mtime;
          if (isExpired(createdAt)) {
            rmSync(filePath, { force: true });
            deleted += 1;
          }
        }
        removeEmptyParents(domainDir);
      }
    }

    return { deleted };
  },

  purgeAll: () => {
    rmSync(CACHE_DIR, { recursive: true, force: true });
    mkdirSync(CACHE_DIR, { recursive: true });
  },

  getCacheDir: (): string => {
    return CACHE_DIR;
  },
};
