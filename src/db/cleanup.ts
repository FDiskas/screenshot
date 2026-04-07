import { dbService } from "./index";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import db from "./index";

async function runCleanup() {
  console.log("🚀 Starting screenshot maintenance/cleanup...");
  
  try {
    // 1. Get list of images to delete before purging from DB
    const expiredImages = db.query(
      "SELECT image_path FROM screenshots WHERE expires_at < datetime('now') AND image_path IS NOT NULL"
    ).all() as { image_path: string }[];
    
    console.log(`🧹 Found ${expiredImages.length} expired screenshot files to delete.`);
    
    for (const img of expiredImages) {
      if (img.image_path) {
        const fullPath = join(process.cwd(), "public", img.image_path);
        try {
          await unlink(fullPath);
          console.log(`✅ Deleted file: ${img.image_path}`);
        } catch (e: any) {
          console.warn(`⚠️ Failed to delete ${img.image_path}: ${e.message}`);
        }
      }
    }
    
    // 2. Clear from Database
    const result = dbService.cleanup();
    console.log(`✅ Database records purged.`);
    
    console.log("✨ Maintenance complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

runCleanup();
