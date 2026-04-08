import { hatchet } from "./lib/hatchet";
import { ScreenshotWorkflow } from "./lib/workflows/screenshot.workflow";
import { CleanupWorkflow } from "./lib/workflows/cleanup.workflow";
import { PurgeWorkflow } from "./lib/workflows/purge.workflow";
import { CONFIG } from "./config";
import { cacheService } from "./lib/cache";

async function main() {
  const worker = await hatchet.worker(CONFIG.worker.name, {
    slots: CONFIG.worker.slots,
  });
  await worker.registerWorkflow(ScreenshotWorkflow);
  await worker.registerWorkflow(CleanupWorkflow);
  await worker.registerWorkflow(PurgeWorkflow);
  await worker.start();
  console.log("Hatchet worker started and listening for screenshot events...");
  console.log(
    `[Storage] cwd=${process.cwd()} cacheDir=${cacheService.getCacheDir()}`,
  );
}

main().catch(console.error);
