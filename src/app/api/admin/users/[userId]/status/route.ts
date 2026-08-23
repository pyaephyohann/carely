
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { apiSuccess, apiError, requireDatabase } from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireAdmin(request as never);
  if (!auth.authenticated) return auth.response;

  const { userId } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !["ACTIVE", "SUSPENDED", "INACTIVE"].includes(status)) {
      return apiError("Invalid status", "VALIDATION_ERROR", 400, {
        status: ["Must be ACTIVE, SUSPENDED, or INACTIVE"],
      });
    }

    const user = await prisma!.user.findUnique({ where: { id: userId } });
    if (!user) {
      return apiError("User not found", "NOT_FOUND", 404);
    }

    // Prevent suspending self
    if (userId === auth.user.userId) {
      return apiError("Cannot modify your own account status", "SELF_MODIFICATION", 400);
    }

    const updated = await prisma!.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Audit log
    await prisma!.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "UPDATE",
        entityType: "User",
        entityId: userId,
        metadata: { action: "STATUS_CHANGE", from: user.status, to: status },
      },
    });

    return apiSuccess({
      id: updated.id,
      email: updated.email,
      role: updated.role,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Admin user status error:", error);
    return apiError("Failed to update user status", "STATUS_ERROR", 500);
  }
}
