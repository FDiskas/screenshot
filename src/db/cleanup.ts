import { dbService } from "./index";

export async function runCleanup() {
  console.log("Starting screenshot cleanup...");

  const result = dbService.cleanup();
  console.log(`Deleted ${result.deleted} expired screenshots.`);
  console.log("Cleanup complete.");
  return { success: true, deleted: result.deleted };
}

if (import.meta.main) {
  runCleanup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Cleanup failed:", error);
      process.exit(1);
    });
}
