/**
 * Production-safe logger.
 *
 * In development: full error details, stack traces.
 * In production: sanitized messages only — no stack traces, no query details, no PII.
 *
 * Usage:
 *   import { logError, logWarn } from "@/lib/logger";
 *   logError("Failed to create appointment", error);
 */

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Extract a safe, human-readable message from an error.
 * In production, strips stack traces, query details, and internal paths.
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    let message = error.message || "Unknown error";

    if (isProduction()) {
      // Strip file paths that could reveal server structure
      message = message
        .replace(/\/[^\s:]+/g, "[path]")
        .replace(/PrismaClient.*/g, "[database error]")
        .replace(/P[0-9]{4}/g, "[error code]");

      // Truncate very long messages
      if (message.length > 200) {
        message = message.slice(0, 200) + "...";
      }
    }

    return message;
  }

  return String(error);
}

/**
 * Log an error with appropriate detail level.
 */
export function logError(context: string, error?: unknown): void {
  if (isProduction()) {
    // Production: context + sanitized message only
    const msg = error ? sanitizeError(error) : "unknown error";
    console.error(`[ERROR] ${context}: ${msg}`);
  } else {
    // Development: full details
    if (error instanceof Error) {
      console.error(`[ERROR] ${context}:`, error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(`[ERROR] ${context}:`, error);
    }
  }
}

/**
 * Log a warning.
 */
export function logWarn(context: string, detail?: string): void {
  console.warn(`[WARN] ${context}${detail ? `: ${detail}` : ""}`);
}

/**
 * Log an informational message (only in development).
 */
export function logInfo(context: string, detail?: string): void {
  if (!isProduction()) {
    console.log(`[INFO] ${context}${detail ? `: ${detail}` : ""}`);
  }
}
