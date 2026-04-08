import { hatchet } from "../hatchet";
import { captureScreenshot } from "../screenshot";
import { cacheService } from "../cache";
import { CONFIG } from "../../config";

interface ScreenshotInput {
  url: string;
  width: number;
  height: number;
  [key: string]: any;
}

export const ScreenshotWorkflow = hatchet.workflow<ScreenshotInput>({
  name: CONFIG.workflows.screenshot.name,
  on: {
    event: CONFIG.server.screenshotEventName,
  },
});

ScreenshotWorkflow.task({
  name: CONFIG.workflows.screenshot.taskName,
  fn: async (input, ctx) => {
    const { url, width, height } = input;
    const domainUrl = cacheService.getDomainUrl(url);
    console.log(
      `[Workflow] Processing screenshot for: ${domainUrl} (${width}x${height})`,
    );

    try {
      const result = await captureScreenshot({ url: domainUrl, width, height });

      if (result.buffer) {
        const imagePath = cacheService.save(domainUrl, result.buffer);
        if (result.status === 200) {
          console.log(`Successfully captured screenshot for ${domainUrl}`);
        } else {
          console.log(
            `Captured fallback screenshot for ${domainUrl} with status ${result.status}`,
          );
        }
        return { status: result.status, imagePath };
      } else {
        console.log(
          `Screenshot failed for ${domainUrl} with status ${result.status}`,
        );
        return { status: result.status };
      }
    } catch (error: any) {
      console.error(`Workflow error for ${domainUrl}:`, error);
      throw error; // Let Hatchet handle retries if configured
    }
  },
});
