import "server-only";
import sharp from "sharp";
import { assertSafePublicUrl } from "@/lib/url-safety";
import { classifyLogoPixels, inferLogoSurfaceTone, type LogoSurfaceTone } from "@/lib/logo-presentation";

const MAX_LOGO_BYTES = 3 * 1024 * 1024;

async function readLimitedBody(response: Response) {
  if (!response.body) throw new Error("Logo response had no body.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_LOGO_BYTES) throw new Error("Logo asset exceeded the size limit.");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

async function fetchPublicLogo(inputUrl: string) {
  let currentUrl = await assertSafePublicUrl(inputUrl);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "image/svg+xml,image/png,image/jpeg,image/webp,image/*;q=0.8" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === 3) throw new Error("Logo redirect could not be resolved safely.");
      currentUrl = await assertSafePublicUrl(new URL(location, currentUrl).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Logo request failed with ${response.status}.`);
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    if (!contentType.startsWith("image/") && !contentType.includes("svg")) {
      throw new Error("Logo URL did not return an image.");
    }
    return readLimitedBody(response);
  }
  throw new Error("Logo redirect limit exceeded.");
}

export async function detectLogoSurfaceTone(logoUrl: string): Promise<LogoSurfaceTone> {
  const fallback = inferLogoSurfaceTone(logoUrl);
  if (!logoUrl) return fallback;
  try {
    const asset = await fetchPublicLogo(logoUrl);
    const { data, info } = await sharp(asset)
      .ensureAlpha()
      .resize({ width: 128, height: 128, fit: "inside", withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });
    return classifyLogoPixels(data, info.channels) || fallback;
  } catch {
    return fallback;
  }
}
