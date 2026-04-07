import { hatchet } from "./lib/hatchet";
import { ScreenshotWorkflow } from "./lib/workflows/screenshot.workflow";
import { CleanupWorkflow } from "./lib/workflows/cleanup.workflow";
import { PurgeWorkflow } from "./lib/workflows/purge.workflow";

async function main() {
  const worker = await hatchet.worker("screenshot-worker", {
    slots: 1,
  });
  await worker.registerWorkflow(ScreenshotWorkflow);
  await worker.registerWorkflow(CleanupWorkflow);
  await worker.registerWorkflow(PurgeWorkflow);
  console.log("Hatchet worker started and listening for screenshot events...");
  await worker.start();
}

main().catch(console.error);
