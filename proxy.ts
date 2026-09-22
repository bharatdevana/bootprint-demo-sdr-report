import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  isDemoPasswordConfigured,
  verifyDemoSession,
} from "@/lib/demo-auth";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/auth/logout"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authenticated = verifyDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value);

  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  if (!isDemoPasswordConfigured()) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Demo access is not configured." }, { status: 503 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authenticated) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in to use the account research demo." }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg|.well-known/workflow).*)"],
};
