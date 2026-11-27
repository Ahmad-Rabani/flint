import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { applySecurityHeaders } from "@/lib/security/headers";

const SESSION_COOKIE = "flint_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function readSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = getSecret();
  if (!token || !secret) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      role: String(payload.role || ""),
      permissions: (payload.permissions as string[]) || [],
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request);

  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/setup");

  if (isAdminRoute) {
    if (!session || session.role === "customer") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  if (pathname.startsWith("/account") && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  if (isAuthRoute && session && session.role !== "customer" && pathname !== "/setup") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/login", "/register", "/setup"],
};
