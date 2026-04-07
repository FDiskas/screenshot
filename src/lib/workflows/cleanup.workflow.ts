import { hatchet } from "../hatchet";
import { runCleanup } from "../../db/cleanup";
import { CONFIG } from "../../config";

export const CleanupWorkflow = hatchet.workflow({
  name: CONFIG.workflows.cleanup.name,
  on: {
    cron: CONFIG.workflows.cleanup.cron,
  },
});

CleanupWorkflow.task({
  name: CONFIG.workflows.cleanup.taskName,
  fn: async () => {
    console.log("[Hatchet] Running scheduled cleanup...");
    const result = await runCleanup();
    return result;
  },
});
