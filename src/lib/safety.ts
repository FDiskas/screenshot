export interface SafetyCheckResult {
  url: string;
  status: boolean; // false means safe
}

export const checkSafety = async (url: string): Promise<boolean> => {
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`https://is.coders.lt/?site=${encodedUrl}`);
    
    if (!response.ok) {
      console.warn(`Safety check failed for ${url} with status ${response.status}`);
      // Fallback to safe if API is down? Or unsafe? 
      // User said "status false means safe to use", if API fails we should probably be cautious.
      // But for a demo, we might want to continue. Let's assume it's unsafe if API fails.
      return false; 
    }
    
    const data = await response.json() as SafetyCheckResult;
    // status: false -> safe
    // status: true -> unsafe
    return data.status === false;
  } catch (error) {
    console.error(`Error checking safety for ${url}:`, error);
    return false;
  }
};
