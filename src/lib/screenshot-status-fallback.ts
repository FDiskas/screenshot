import sharp from "sharp";

const escapeXml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const buildStatusFallbackSvg = (
  width: number,
  height: number,
  status: number,
  message: string,
): string => {
  const safeMessage = escapeXml(message);
  const codeFontSize = Math.max(72, Math.round(Math.min(width, height) * 0.34));
  const messageFontSize = Math.max(18, Math.round(codeFontSize * 0.22));

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#f8fafc" />
      <text x="50%" y="47%" fill="#111827" font-family="Arial, Helvetica, sans-serif" font-size="${codeFontSize}" font-weight="800" text-anchor="middle" dominant-baseline="middle">${status}</text>
      <text x="50%" y="64%" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="${messageFontSize}" font-weight="600" text-anchor="middle" dominant-baseline="middle">${safeMessage}</text>
    </svg>
  `;
};

export const createStatusFallbackBuffer = async (
  width: number,
  height: number,
  status: number,
): Promise<Buffer> => {
  const fallbackSvg = buildStatusFallbackSvg(
    width,
    height,
    status,
    "Page unavailable",
  );
  return sharp(Buffer.from(fallbackSvg)).png().toBuffer();
};
