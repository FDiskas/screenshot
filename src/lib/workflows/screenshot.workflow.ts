import { hatchet } from "../hatchet";
import { dbService } from "../../db";
import { captureScreenshot } from "../screenshot";
import { cacheService } from "../cache";
import { RateLimitDuration } from "@hatchet-dev/typescript-sdk";

interface ScreenshotInput {
  url: string;
  width: number;
  height: number;
  [key: string]: any;
}

export const ScreenshotWorkflow = hatchet.workflow<ScreenshotInput>({
  name: "screenshot-workflow",
  on: {
    event: "screenshot:create"
  },
});

ScreenshotWorkflow.task({
  name: "process-screenshot",
  rateLimits: [
    {
      key: "screenshot-limit",
      units: 1,
      limit: 2,
      duration: RateLimitDuration.MINUTE,
    }
  ],
  fn: async (input, ctx) => {
    const { url, width, height } = input;
    console.log(`[Workflow] Processing screenshot for: ${url} (${width}x${height})`);

    const domain = cacheService.getDomain(url);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const expiresAt = oneMonthFromNow.toISOString().slice(0, 19).replace('T', ' ');

    try {
      const result = await captureScreenshot({ url, width, height });

      if (result.status === 200 && result.buffer) {
        const imagePath = cacheService.save(url, result.buffer, 200);

        dbService.add({
          url,
          domain,
          status: 200,
          image_path: imagePath,
          expires_at: expiresAt
        });
        console.log(`Successfully captured screenshot for ${url}`);
        return { status: 200, imagePath };
      } else {
        // If broken, still record it so we don't recheck for 1 month
        dbService.add({
          url,
          domain,
          status: result.status,
          image_path: null,
          expires_at: expiresAt
        });
        console.log(`Recorded broken site ${url} with status ${result.status}`);
        return { status: result.status };
      }
    } catch (error: any) {
      console.error(`Workflow error for ${url}:`, error);
      // Update DB to error state so we don't stay in 202 "Processing" forever
      dbService.add({
        url,
        domain,
        status: 500,
        image_path: null,
        expires_at: expiresAt
      });
      throw error; // Let Hatchet handle retries if configured
    }
  }
});
