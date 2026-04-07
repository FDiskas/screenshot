import { hatchet } from "./lib/hatchet";
import { ScreenshotWorkflow } from "./lib/workflows/screenshot.workflow";

async function main() {
  const worker = await hatchet.worker("screenshot-worker", {
    slots: 1,
  });
  await worker.registerWorkflow(ScreenshotWorkflow);
  console.log("Hatchet worker started and listening for screenshot events...");
  await worker.start();
}

main().catch(console.error);
