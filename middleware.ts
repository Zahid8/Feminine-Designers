import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isStaffSession, safeNextPath } from "@/lib/auth/simple-auth";

const PUBLIC_FILE_PATTERN = /\.(?:ico|png|jpg|jpeg|svg|webp|css|js|txt|xml|json|map)$/i;

function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/_next/") || PUBLIC_FILE_PATTERN.test(pathname);
}

function requestedPath(request: NextRequest) {
  const path = request.nextUrl.pathname === "/" ? "/dashboard" : request.nextUrl.pathname;
  return `${path}${request.nextUrl.search}`;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authenticated = isStaffSession(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL(safeNextPath(request.nextUrl.searchParams.get("next")), request.url));
  }

  if (isPublicPath(pathname) || authenticated) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", requestedPath(request));
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
