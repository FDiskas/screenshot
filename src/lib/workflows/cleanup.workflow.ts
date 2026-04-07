import { hatchet } from "../hatchet";
import { runCleanup } from "../../db/cleanup";

export const CleanupWorkflow = hatchet.workflow({
  name: "cleanup-workflow",
  on: {
    cron: "0 0 * * *", // Every night at midnight
  },
});

CleanupWorkflow.task({
  name: "run-cleanup-task",
  fn: async () => {
    console.log("[Hatchet] Running scheduled cleanup...");
    const result = await runCleanup();
    return result;
  },
});
