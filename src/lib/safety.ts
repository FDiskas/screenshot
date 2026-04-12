import { CONFIG } from "../config";

export interface SafetyCheckResult {
  url: string;
  status: boolean; // false means safe
}

export const checkSafety = async (url: string): Promise<boolean> => {
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(
      `${CONFIG.safety.apiBaseUrl}/?site=${encodedUrl}`,
    );

    if (!response.ok) {
      // Cancel the body so the underlying TCP socket is released immediately
      // rather than waiting for GC to finalize the Response object.
      await response.body?.cancel().catch(() => {});
      console.warn(
        `Safety check failed for ${url} with status ${response.status}`,
      );
      return false;
    }

    const data = (await response.json()) as SafetyCheckResult;
    // status: false -> safe
    // status: true -> unsafe
    return data.status === false;
  } catch (error) {
    console.error(`Error checking safety for ${url}:`, error);
    return false;
  }
};
