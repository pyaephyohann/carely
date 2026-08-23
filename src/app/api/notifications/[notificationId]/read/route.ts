import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { markAsRead } from "@/lib/notifications";

// =============================================================================
// POST /api/notifications/[notificationId]/read
// Mark a notification as read
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { notificationId } = await params;

    const success = await markAsRead(notificationId, auth.user.userId);
    if (!success) {
      return apiError("Notification not found", "NOT_FOUND", 404);
    }

    return apiSuccess({ read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return apiError("Failed to mark notification as read", "INTERNAL_ERROR", 500);
  }
}
