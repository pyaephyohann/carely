import { NextResponse, type NextRequest } from "next/server";
import {
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  verifyAccessToken,
  ACCESS_TOKEN_NAME,
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

function collectSetCookies(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const raw = response.headers.get("set-cookie");
  if (!raw) return [];
  // Fallback: split on cookie-name boundaries (comma alone is ambiguous)
  return raw.split(/,(?=\s*carely_)/).map((part) => part.trim()).filter(Boolean);
}

function extractCookieValue(setCookieLines: string[], name: string): string | null {
  for (const line of setCookieLines) {
    const match = line.match(new RegExp(`(?:^|;\\s*)?${name}=([^;]+)`));
    if (match?.[1]) return match[1];
  }
  return null;
}

function attachCookies(response: NextResponse, cookies: string[]): NextResponse {
  for (const cookie of cookies) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
}

/**
 * When the access JWT is missing/expired but a refresh cookie is present,
 * call /api/auth/refresh and return the renewed user + Set-Cookie lines.
 */
async function attemptSessionRefresh(
  request: NextRequest,
): Promise<{ user: AccessTokenPayload; cookies: string[] } | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!getRefreshTokenFromCookies(cookieHeader)) {
    return null;
  }

  try {
    const refreshUrl = new URL("/api/auth/refresh", request.url);
    const refreshResponse = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        cookie: cookieHeader || "",
      },
    });

    if (!refreshResponse.ok) {
      return null;
    }

    const cookies = collectSetCookies(refreshResponse);
    const accessToken = extractCookieValue(cookies, ACCESS_TOKEN_NAME);
    if (!accessToken) {
      return null;
    }

    const user = await verifyAccessToken(accessToken);
    return { user, cookies };
  } catch {
    return null;
  }
}

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

  // Verify access session; refresh when possible
  let user: AccessTokenPayload | null = null;
  let refreshedCookies: string[] = [];
  const cookieHeader = request.headers.get("cookie");
  const token = getAccessTokenFromCookies(cookieHeader);

  if (token) {
    try {
      user = await verifyAccessToken(token);
    } catch {
      user = null;
    }
  }

  if (!user) {
    const refreshed = await attemptSessionRefresh(request);
    if (refreshed) {
      user = refreshed.user;
      refreshedCookies = refreshed.cookies;
    }
  }

  const finish = (response: NextResponse) =>
    refreshedCookies.length > 0 ? attachCookies(response, refreshedCookies) : response;

  // --- Unauthenticated ---
  if (!user) {
    if (routeType === "auth") return finish(NextResponse.next());
    if (routeType === "public") return finish(NextResponse.next());

    // Protected area without recoverable session
    const loginUrl = new URL(ROLE_LOGIN_MAP[routeType] || "/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return finish(NextResponse.redirect(loginUrl));
  }

  // --- Authenticated ---
  if (routeType === "auth") {
    const redirectUrl = ROLE_HOME_MAP[user.role] || "/patient/dashboard";
    return finish(NextResponse.redirect(new URL(redirectUrl, request.url)));
  }

  if (routeType === "public") return finish(NextResponse.next());

  // Check role access
  const allowedPrefixes = ROLE_ACCESS_MAP[user.role];
  if (!allowedPrefixes || !allowedPrefixes.some((p) => pathname.startsWith(p))) {
    const redirectUrl = ROLE_HOME_MAP[user.role] || "/patient/dashboard";
    return finish(NextResponse.redirect(new URL(redirectUrl, request.url)));
  }

  return finish(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon|.*\\.).*)",
  ],
};
