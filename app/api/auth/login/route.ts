import { NextRequest, NextResponse } from "next/server";
import {
  createDemoSession,
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_SECONDS,
  isDemoPasswordConfigured,
  passwordMatches,
} from "@/lib/demo-auth";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isDemoPasswordConfigured()) {
    return NextResponse.json({ error: "Demo access is not configured." }, { status: 503 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "JSON required." }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const password = typeof body === "object" && body !== null && "password" in body
    ? (body as { password?: unknown }).password
    : undefined;
  if (!passwordMatches(password)) {
    return NextResponse.json({ error: "Incorrect demo password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: DEMO_SESSION_COOKIE,
    value: createDemoSession(),
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "strict",
    maxAge: DEMO_SESSION_SECONDS,
    path: "/",
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
