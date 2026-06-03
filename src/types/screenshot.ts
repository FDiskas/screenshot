export interface ScreenshotRecord {
  id: number;
  url: string;
  domain: string;
  status: number;
  image_path: string | null;
  created_at: string;
  expires_at?: string;
}
