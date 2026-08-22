import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { UserRole } from "@/types";

// =============================================================================
// JWT Configuration
// =============================================================================

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";


function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

// =============================================================================
// Token Payloads
// =============================================================================

export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
}

// =============================================================================
// Token Signing & Verification
// =============================================================================

export async function signAccessToken(payload: {
  userId: string;
  email: string;
  role: UserRole;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setSubject(payload.userId)
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as AccessTokenPayload;
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setSubject(userId)
    .sign(getRefreshSecret());
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return payload as RefreshTokenPayload;
}

// =============================================================================
// Cookie Helpers (Edge Runtime compatible)
// =============================================================================

const ACCESS_TOKEN_NAME = "carely_access_token";
const REFRESH_TOKEN_NAME = "carely_refresh_token";
const COOKIE_PATH = "/";

function getCookieOptions(maxAge: number): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `Path=${COOKIE_PATH}`,
    `Max-Age=${maxAge}`,
    "HttpOnly",
    isProd ? "Secure" : "",
    "SameSite=Lax",
  ].filter(Boolean);
  return parts.join("; ");
}

export function setAccessTokenCookie(
  cookieHeader: string | null,
  token: string,
): string {
  const maxAge = 15 * 60; // 15 minutes
  const cookie = `${ACCESS_TOKEN_NAME}=${token}; ${getCookieOptions(maxAge)}`;
  const existing = cookieHeader || "";
  const filtered = existing
    .split("; ")
    .filter((c) => !c.startsWith(`${ACCESS_TOKEN_NAME}=`))
    .join("; ");
  return filtered ? `${filtered}; ${cookie}` : cookie;
}

export function setRefreshTokenCookie(
  cookieHeader: string | null,
  token: string,
  rememberMe: boolean = false,
): string {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30d or 7d
  const cookie = `${REFRESH_TOKEN_NAME}=${token}; ${getCookieOptions(maxAge)}`;
  const existing = cookieHeader || "";
  const filtered = existing
    .split("; ")
    .filter((c) => !c.startsWith(`${REFRESH_TOKEN_NAME}=`))
    .join("; ");
  return filtered ? `${filtered}; ${cookie}` : cookie;
}

export function setAuthCookies(
  cookieHeader: string | null,
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean = false,
): string {
  let result = setAccessTokenCookie(cookieHeader, accessToken);
  result = setRefreshTokenCookie(result, refreshToken, rememberMe);
  return result;
}

export function clearAuthCookies(cookieHeader: string | null): string {
  const expired = "Max-Age=0; Path=/; HttpOnly; SameSite=Lax";
  const existing = cookieHeader || "";
  const filtered = existing
    .split("; ")
    .filter(
      (c) =>
        !c.startsWith(`${ACCESS_TOKEN_NAME}=`) &&
        !c.startsWith(`${REFRESH_TOKEN_NAME}=`),
    )
    .join("; ");
  return `${filtered}; ${ACCESS_TOKEN_NAME}=; ${expired}; ${REFRESH_TOKEN_NAME}=; ${expired}`.replace(/^;\s*/, "");
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name) {
      cookies[name.trim()] = rest.join("=").trim();
    }
  }
  return cookies;
}

export function getAccessTokenFromCookies(cookieHeader: string | null): string | null {
  const cookies = parseCookies(cookieHeader);
  return cookies[ACCESS_TOKEN_NAME] || null;
}

export function getRefreshTokenFromCookies(cookieHeader: string | null): string | null {
  const cookies = parseCookies(cookieHeader);
  return cookies[REFRESH_TOKEN_NAME] || null;
}

export { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME };
