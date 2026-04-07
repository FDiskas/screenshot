import { dbService } from "../db";
import { captureScreenshot } from "./screenshot";
import { cacheService } from "./cache";
import { join } from "node:path";

export const processScreenshot = async (url: string, width = 387, height = 217) => {
  const domain = cacheService.getDomain(url);
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  const expiresAt = oneMonthFromNow.toISOString().slice(0, 19).replace('T', ' ');

  // Record that we are processing
  dbService.add({
    url,
    domain,
    status: 202,
    image_path: null,
    expires_at: expiresAt
  });

  try {
    const result = await captureScreenshot({ url, width, height });
    
    if (result.status === 200 && result.buffer) {
      const imagePath = cacheService.save(url, result.buffer, 200);
      
      // Check if we already have an entry and update it, or add new
      // For simplicity, we just add a new one if it's the first time
      dbService.add({
        url,
        domain,
        status: 200,
        image_path: imagePath,
        expires_at: expiresAt
      });
      console.log(`Successfully captured screenshot for ${url}`);
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
    }
  } catch (error) {
    console.error(`Worker error for ${url}:`, error);
    // Update DB to error state so we don't stay in 202 "Processing" forever
    dbService.add({
      url,
      domain,
      status: 500,
      image_path: null,
      expires_at: expiresAt
    });
  }
};
