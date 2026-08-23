import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/notifications";

// =============================================================================
// GET /api/notifications/preferences
// Get the authenticated user's notification preferences
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const prefs = await getNotificationPreferences(auth.user.userId);
    if (!prefs) {
      return apiError("Failed to load preferences", "INTERNAL_ERROR", 500);
    }

    return apiSuccess({
      appointmentUpdates: prefs.appointmentUpdates,
      appointmentReminders: prefs.appointmentReminders,
      prescriptionUpdates: prefs.prescriptionUpdates,
      pharmacyUpdates: prefs.pharmacyUpdates,
      emailEnabled: prefs.emailEnabled,
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return apiError("Failed to fetch preferences", "INTERNAL_ERROR", 500);
  }
}

// =============================================================================
// PATCH /api/notifications/preferences
// Update the authenticated user's notification preferences
// =============================================================================

export async function PATCH(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    // Validate allowed fields
    const allowed = [
      "appointmentUpdates",
      "appointmentReminders",
      "prescriptionUpdates",
      "pharmacyUpdates",
      "emailEnabled",
    ];
    const updates: Record<string, boolean> = {};
    for (const key of allowed) {
      if (key in body && typeof body[key] === "boolean") {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No valid fields to update", "VALIDATION_ERROR", 400);
    }

    const prefs = await updateNotificationPreferences(auth.user.userId, updates);
    if (!prefs) {
      return apiError("Failed to update preferences", "INTERNAL_ERROR", 500);
    }

    return apiSuccess({
      appointmentUpdates: prefs.appointmentUpdates,
      appointmentReminders: prefs.appointmentReminders,
      prescriptionUpdates: prefs.prescriptionUpdates,
      pharmacyUpdates: prefs.pharmacyUpdates,
      emailEnabled: prefs.emailEnabled,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return apiError("Failed to update preferences", "INTERNAL_ERROR", 500);
  }
}
