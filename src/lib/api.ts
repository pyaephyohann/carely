import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns a 503 response if the database is not available.
 * Returns null if the database is ready (caller should proceed).
 */
export function requireDatabase(): NextResponse | null {
  if (!prisma) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Database is not configured. Please set DATABASE_URL.",
        },
      },
      { status: 503 }
    );
  }
  return null;
}

/**
 * Standard error response helper
 */
export function apiError(
  message: string,
  code: string = "INTERNAL_ERROR",
  status: number = 500,
  details?: Record<string, string[]>
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
    },
    { status }
  );
}

/**
 * Standard success response helper
 */
export function apiSuccess<T>(
  data: T,
  statusOrOptions: number | { status?: number; pagination?: { page: number; limit: number; total: number; totalPages: number } } = 200,
) {
  if (typeof statusOrOptions === "number") {
    return NextResponse.json({ success: true, data }, { status: statusOrOptions });
  }
  return NextResponse.json(
    {
      success: true,
      data,
      ...(statusOrOptions.pagination ? { meta: statusOrOptions.pagination } : {}),
    },
    { status: statusOrOptions.status ?? 200 },
  );
}
