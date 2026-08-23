import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { markAllAsRead } from "@/lib/notifications";

// =============================================================================
// POST /api/notifications/read-all
// Mark all notifications as read
// =============================================================================

export async function POST(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const count = await markAllAsRead(auth.user.userId);
    return apiSuccess({ marked: count });
  } catch (error) {
    logError("Error marking all as read:", error);
    return apiError("Failed to mark all as read", "INTERNAL_ERROR", 500);
  }
}
