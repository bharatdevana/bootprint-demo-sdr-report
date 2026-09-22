import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const DEMO_SESSION_COOKIE = "bootprint_sdr_session";
export const DEMO_SESSION_SECONDS = 12 * 60 * 60;
const MINIMUM_PASSWORD_LENGTH = 20;

function safeEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function configuredPassword() {
  return process.env.DEMO_PASSWORD ?? "";
}

function sign(body: string) {
  return createHmac("sha256", configuredPassword()).update(body).digest("base64url");
}

export function isDemoPasswordConfigured() {
  return configuredPassword().length >= MINIMUM_PASSWORD_LENGTH;
}

export function passwordMatches(candidate: unknown) {
  return typeof candidate === "string" && candidate.length <= 256 && safeEqual(candidate, configuredPassword());
}

export function createDemoSession(now = Date.now()) {
  const body = Buffer.from(JSON.stringify({
    expiresAt: now + DEMO_SESSION_SECONDS * 1000,
    nonce: randomBytes(16).toString("hex"),
  })).toString("base64url");

  return `${body}.${sign(body)}`;
}

export function verifyDemoSession(token: string | undefined, now = Date.now()) {
  if (!token || !isDemoPasswordConfigured()) return false;

  try {
    const [body, signature, extra] = token.split(".");
    if (!body || !signature || extra || !safeEqual(sign(body), signature)) return false;
    const session = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { expiresAt?: unknown };
    return typeof session.expiresAt === "number"
      && session.expiresAt > now
      && session.expiresAt <= now + (DEMO_SESSION_SECONDS + 60) * 1000;
  } catch {
    return false;
  }
}
