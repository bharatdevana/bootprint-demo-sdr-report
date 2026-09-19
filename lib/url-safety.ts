import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const blockedHosts = new Set(["localhost", "localhost.localdomain", "metadata", "metadata.google.internal"]);

function blockedAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (isIP(address) === 6) {
    const value = address.toLowerCase();
    return value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd") ||
      /^fe[89ab]/.test(value) || value.startsWith("ff");
  }
  return true;
}

export function normalizeWebUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a company website.");
  if (trimmed.length > 2048) throw new Error("The URL is too long.");
  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed.replace(/^http:\/\//i, "https://")
    : `https://${trimmed}`;
  try {
    return new URL(candidate).toString();
  } catch {
    throw new Error("Enter a valid company website.");
  }
}

export async function assertSafePublicUrl(value: string) {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error("Only public HTTPS company websites are accepted.");
  }
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || blockedHosts.has(hostname) || hostname.endsWith(".local")) {
    throw new Error("Private or local network addresses are not accepted.");
  }
  if (isIP(hostname)) {
    if (blockedAddress(hostname)) throw new Error("Private or reserved IP addresses are not accepted.");
  } else {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => blockedAddress(address))) {
      throw new Error("The hostname does not resolve to a public address.");
    }
  }
  parsed.hash = "";
  return parsed.toString();
}
