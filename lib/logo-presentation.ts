export type LogoSurfaceTone = "light" | "dark";

const DARK_SURFACE_HINTS = /(?:^|[-_.%20])(white|light|reverse|reversed|inverted|knockout|negative)(?:[-_.%20]|$)/i;
const LIGHT_SURFACE_HINTS = /(?:^|[-_.%20])(black|dark|primary|color|colour)(?:[-_.%20]|$)/i;

export function inferLogoSurfaceTone(url: string, explicit?: LogoSurfaceTone): LogoSurfaceTone {
  if (explicit) return explicit;
  let pathname = url;
  try { pathname = decodeURIComponent(new URL(url).pathname); }
  catch { /* Use the original value as a conservative fallback. */ }
  if (DARK_SURFACE_HINTS.test(pathname)) return "dark";
  if (LIGHT_SURFACE_HINTS.test(pathname)) return "light";
  return "light";
}

export function classifyLogoPixels(data: Uint8Array, channels: number): LogoSurfaceTone | null {
  if (channels < 3) return null;
  let visibleWeight = 0;
  let luminanceTotal = 0;
  let lightWeight = 0;
  for (let index = 0; index + channels - 1 < data.length; index += channels) {
    const alpha = channels >= 4 ? data[index + 3] / 255 : 1;
    if (alpha < 0.08) continue;
    const red = data[index] / 255;
    const green = data[index + 1] / 255;
    const blue = data[index + 2] / 255;
    const luminance = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
    visibleWeight += alpha;
    luminanceTotal += luminance * alpha;
    if (luminance >= 0.78) lightWeight += alpha;
  }
  if (visibleWeight < 1) return null;
  const averageLuminance = luminanceTotal / visibleWeight;
  const lightShare = lightWeight / visibleWeight;
  return averageLuminance >= 0.72 || lightShare >= 0.68 ? "dark" : "light";
}
