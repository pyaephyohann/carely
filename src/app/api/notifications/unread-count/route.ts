import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { getUnreadCount } from "@/lib/notifications";

// =============================================================================
// GET /api/notifications/unread-count
// Get the count of unread notifications
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const count = await getUnreadCount(auth.user.userId);
    return apiSuccess({ count });
  } catch (error) {
    logError("Error getting unread count:", error);
    return apiError("Failed to get unread count", "INTERNAL_ERROR", 500);
  }
}
