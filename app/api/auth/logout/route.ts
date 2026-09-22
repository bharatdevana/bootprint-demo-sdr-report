import { NextRequest, NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/demo-auth";

export function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: DEMO_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
