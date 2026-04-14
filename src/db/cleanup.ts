import { dbService } from "./index";

export async function runCleanup() {
  console.log("Starting screenshot cleanup...");

  try {
    const result = dbService.cleanup();
    console.log(`Deleted ${result.deleted} expired screenshots.`);
    console.log("Cleanup complete.");
    return { success: true, deleted: result.deleted };
  } catch (error) {
    console.error("Cleanup failed:", error);
    throw error;
  }
}

if (import.meta.main) {
  runCleanup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
