import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

// =============================================================================
// GET /api/notifications
// List the authenticated user's notifications
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const unreadOnly = searchParams.get("unread") === "true";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: auth.user.userId };
    if (unreadOnly) where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma!.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma!.notification.count({ where }),
      prisma!.notification.count({ where: { userId: auth.user.userId, read: false } }),
    ]);

    const response = apiSuccess(
      notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.read,
        readAt: n.readAt?.toISOString() || null,
        metadata: n.metadata,
        createdAt: n.createdAt.toISOString(),
      })),
      {
        status: 200,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    );
    // Add unreadCount to response body
    const body = await response.json();
    return new Response(JSON.stringify({ ...body, unreadCount }), {
      status: 200,
      headers: response.headers,
    });
  } catch (error) {
    logError("Error fetching notifications:", error);
    return apiError("Failed to fetch notifications", "INTERNAL_ERROR", 500);
  }
}
