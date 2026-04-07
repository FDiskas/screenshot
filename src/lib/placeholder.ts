import sharp from "sharp";

export const generatePlaceholder = async (text: string, width = 387, height = 217): Promise<Buffer> => {
  const svg = 
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="20" fill="#6b7280">${text}</text>
    </svg>`;

  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return buffer;
};

export const getStatusPlaceholder = async (status: number, width = 387, height = 217): Promise<Buffer> => {
  let text = `Status: ${status}`;
  if (status === 202) text = "Processing...";
  if (status === 400) text = "Invalid URL";
  if (status === 403) text = "Unsafe Site";
  
  return generatePlaceholder(text, width, height);
};
