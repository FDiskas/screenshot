import { hatchet } from "../hatchet";
import { runPurge } from "../../db/purge";

export const PurgeWorkflow = hatchet.workflow({
  name: "purge-workflow",
});

PurgeWorkflow.task({
  name: "run-purge-task",
  fn: async () => {
    console.log("[Hatchet] Running scheduled purge...");
    const result = await runPurge();
    return result;
  },
});
