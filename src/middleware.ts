import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/jwt";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/auth/") ||
    path.startsWith("/api/auth/");

  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  if (isPublic) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token && (path === "/login" || path === "/signup")) {
      const session = await verifySessionToken(token);
      if (session && !session.mcp) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    const res = NextResponse.redirect(login);
    res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
