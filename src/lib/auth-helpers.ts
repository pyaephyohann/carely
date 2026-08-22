import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifyAccessToken,
  getAccessTokenFromCookies,
  type AccessTokenPayload,
} from "@/lib/auth";
import type { UserRole } from "@/types";

// =============================================================================
// Auth Result Types
// =============================================================================

export interface AuthSuccess {
  authenticated: true;
  user: AccessTokenPayload;
}

export interface AuthFailure {
  authenticated: false;
  response: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

// =============================================================================
// Core Auth Check
// =============================================================================

export async function getAuthUser(request: NextRequest): Promise<AccessTokenPayload | null> {
  const cookieHeader = request.headers.get("cookie");
  const token = getAccessTokenFromCookies(cookieHeader);
  if (!token) return null;
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const user = await getAuthUser(request);
  if (!user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      ),
    };
  }
  return { authenticated: true, user };
}

export async function requireRole(
  request: NextRequest,
  ...roles: UserRole[]
): Promise<AuthResult> {
  const result = await requireAuth(request);
  if (!result.authenticated) return result;
  if (!roles.includes(result.user.role)) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 }
      ),
    };
  }
  return result;
}

export async function requirePatient(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, "PATIENT");
}

export async function requireDoctor(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, "DOCTOR");
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, "ADMIN");
}

export async function requireDoctorOrAdmin(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, "DOCTOR", "ADMIN");
}
