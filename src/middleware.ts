import { NextResponse, type NextRequest } from "next/server";
import {
  getAccessTokenFromCookies,
  verifyAccessToken,
  type AccessTokenPayload,
} from "@/lib/auth";

// =============================================================================
// Route Configuration
// =============================================================================

const PATIENT_PREFIXES = ["/patient"];
const DOCTOR_PREFIXES = ["/doctor"];
const PHARMACY_PREFIXES = ["/pharmacy"];
const ADMIN_PREFIXES = ["/admin"];
const AUTH_PREFIXES = ["/login", "/register", "/forgot-password"];

function getRouteType(pathname: string): "patient" | "doctor" | "pharmacy" | "admin" | "auth" | "public" {
  if (PATIENT_PREFIXES.some((p) => pathname.startsWith(p))) return "patient";
  if (DOCTOR_PREFIXES.some((p) => pathname.startsWith(p))) return "doctor";
  if (PHARMACY_PREFIXES.some((p) => pathname.startsWith(p))) return "pharmacy";
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) return "admin";
  if (AUTH_PREFIXES.some((p) => pathname.startsWith(p))) return "auth";
  return "public";
}

const ROLE_LOGIN_MAP: Record<string, string> = {
  patient: "/login",
  doctor: "/login",
  pharmacy: "/login",
  admin: "/login",
};

const ROLE_HOME_MAP: Record<string, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  PHARMACY: "/pharmacy/dashboard",
  ADMIN: "/admin/dashboard",
};

const ROLE_ACCESS_MAP: Record<string, string[]> = {
  PATIENT: PATIENT_PREFIXES,
  DOCTOR: DOCTOR_PREFIXES,
  PHARMACY: PHARMACY_PREFIXES,
  ADMIN: ADMIN_PREFIXES,
};

// =============================================================================
// Middleware
// =============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const routeType = getRouteType(pathname);

  // Skip API routes, static files, and internal Next.js routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Verify session
  let user: AccessTokenPayload | null = null;
  const cookieHeader = request.headers.get("cookie");
  const token = getAccessTokenFromCookies(cookieHeader);
  if (token) {
    try {
      user = await verifyAccessToken(token);
    } catch {
      user = null;
    }
  }

  // --- Unauthenticated ---
  if (!user) {
    if (routeType === "auth") return NextResponse.next();

    if (routeType === "public") return NextResponse.next();

    // Protected area without session
    const loginUrl = new URL(ROLE_LOGIN_MAP[routeType] || "/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Authenticated ---
  if (routeType === "auth") {
    const redirectUrl = ROLE_HOME_MAP[user.role] || "/patient/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  if (routeType === "public") return NextResponse.next();

  // Check role access
  const allowedPrefixes = ROLE_ACCESS_MAP[user.role];
  if (!allowedPrefixes || !allowedPrefixes.some((p) => pathname.startsWith(p))) {
    const redirectUrl = ROLE_HOME_MAP[user.role] || "/patient/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon|.*\\.).*)",
  ],
};
