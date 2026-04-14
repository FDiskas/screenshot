import { CONFIG } from "../../config";
import { runPurge } from "../../db/purge";
import { hatchet } from "../hatchet";

export const PurgeWorkflow = hatchet.workflow({
  name: CONFIG.workflows.purge.name,
});

PurgeWorkflow.task({
  name: CONFIG.workflows.purge.taskName,
  fn: async () => {
    console.log("[Hatchet] Running scheduled purge...");
    const result = await runPurge();
    return result;
  },
});
