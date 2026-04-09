import sharp from "sharp";
sharp.cache(false);

import { CONFIG } from "../config";

export const generatePlaceholder = async (
  text: string,
  width: number = CONFIG.placeholder.defaultWidth,
  height: number = CONFIG.placeholder.defaultHeight,
): Promise<Buffer> => {
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="20" fill="#6b7280">${text}</text>
    </svg>`;

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return buffer;
};

export const getStatusPlaceholder = async (
  status: number,
  width: number = CONFIG.placeholder.defaultWidth,
  height: number = CONFIG.placeholder.defaultHeight,
): Promise<Buffer> => {
  let text = `Status: ${status}`;
  if (status === 202) text = CONFIG.placeholder.textByStatus.processing;
  if (status === 400) text = CONFIG.placeholder.textByStatus.invalidUrl;
  if (status === 403) text = CONFIG.placeholder.textByStatus.unsafeSite;

  return generatePlaceholder(text, width, height);
};
