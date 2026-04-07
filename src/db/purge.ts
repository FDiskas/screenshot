import { join } from "node:path";
import { rmSync, mkdirSync } from "node:fs";
import db from "./index";

export async function runPurge() {
  console.log("🧨 Starting FULL PURGE of screenshots...");
  
  try {
    // 1. Clear Database first (to avoid orphan records)
    db.run("DELETE FROM screenshots");
    db.run("DELETE FROM sqlite_sequence WHERE name='screenshots'"); // Reset IDs
    console.log("✅ Database records wiped.");
    
    // 2. Clear Files
    const screenshotsDir = join(process.cwd(), "public", "screenshots");
    rmSync(screenshotsDir, { recursive: true, force: true });
    
    // Re-create the empty screenshots directory
    mkdirSync(screenshotsDir, { recursive: true });
    console.log("✅ Deleted all screenshot files and recreated directory.");
    
    console.log("✨ Purge complete.");
    return { success: true };
  } catch (error) {
    console.error("❌ Purge failed:", error);
    throw error;
  }
}

// Only run immediately if executed directly via Bun (CLI)
if (import.meta.main) {
  runPurge()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
