import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CONFIG } from "../config";
import { cacheService } from "../lib/cache";
import { dbService } from "./index";

export async function runPurge() {
  console.log("Starting full purge of screenshots...");

  try {
    // 1. Count files before purge for reporting
    const screenshotsDir = cacheService.getCacheDir();
    let beforeCount = 0;
    if (existsSync(screenshotsDir)) {
      const stack = [screenshotsDir];
      while (stack.length > 0) {
        const current = stack.pop() as string;
        const entries = readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(current, entry.name);
          if (entry.isDirectory()) {
            stack.push(fullPath);
          } else if (
            entry.isFile() &&
            entry.name.endsWith(CONFIG.cache.imageExtension)
          ) {
            beforeCount += 1;
          }
        }
      }
    }

    // 2. Purge all screenshots
    dbService.purgeAll();
    console.log(
      `Deleted ${beforeCount} screenshot files and reset directory structure.`,
    );

    console.log("Purge complete.");
    return { success: true, deleted: beforeCount };
  } catch (error) {
    console.error("Purge failed:", error);
    throw error;
  }
}

// Only run immediately if executed directly via Bun (CLI)
if (import.meta.main) {
  runPurge()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
