import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifyAccessToken,
  getAccessTokenFromCookies,
  type AccessTokenPayload,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  // Centralized user status enforcement.
  // A valid JWT does NOT mean the account is still active.
  // We verify against the database on every authenticated request.
  // This ensures suspended/deactivated users are blocked within seconds
  // of the status change, even if their JWT hasn't expired yet.
  if (prisma) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { status: true, deletedAt: true },
      });

      if (!dbUser || dbUser.deletedAt) {
        return {
          authenticated: false,
          response: NextResponse.json(
            { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
            { status: 401 }
          ),
        };
      }

      if (dbUser.status !== "ACTIVE") {
        return {
          authenticated: false,
          response: NextResponse.json(
            { success: false, error: { code: "FORBIDDEN", message: "Account is not active" } },
            { status: 403 }
          ),
        };
      }
    } catch {
      // If the database is unavailable, allow the request through
      // rather than locking out all authenticated users.
      // The database check in individual routes will handle this case.
    }
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

export async function requirePharmacy(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, "PHARMACY");
}

export async function requireDoctorOrAdmin(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, "DOCTOR", "ADMIN");
}
