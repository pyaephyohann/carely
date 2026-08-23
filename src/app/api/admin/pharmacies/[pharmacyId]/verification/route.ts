
import { Prisma } from "@prisma/client";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { apiSuccess, apiError, requireDatabase } from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pharmacyId: string }> }
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireAdmin(request as never);
  if (!auth.authenticated) return auth.response;

  const { pharmacyId } = await params;

  try {
    const body = await request.json();
    const { verified, active } = body;

    const pharmacy = await prisma!.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { id: true, name: true, verified: true, active: true },
    });

    if (!pharmacy) {
      return apiError("Pharmacy not found", "NOT_FOUND", 404);
    }

    const updateData: Record<string, unknown> = {};

    if (typeof verified === "boolean" && verified !== pharmacy.verified) {
      updateData.verified = verified;
      updateData.verifiedAt = verified ? new Date() : null;
    }

    if (typeof active === "boolean" && active !== pharmacy.active) {
      updateData.active = active;
      if (!active) {
        updateData.deletedAt = new Date();
      } else {
        updateData.deletedAt = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return apiError("No changes to apply", "NO_CHANGE", 400);
    }

    const updated = await prisma!.pharmacy.update({
      where: { id: pharmacyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        verified: true,
        verifiedAt: true,
        active: true,
      },
    });

    // Audit log
    await prisma!.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "UPDATE",
        entityType: "Pharmacy",
        entityId: pharmacyId,
        metadata: {
          action: "PHARMACY_UPDATE",
          pharmacyName: pharmacy.name,
          verifiedChanged: typeof verified === "boolean",
          activeChanged: typeof active === "boolean",
        } as Prisma.InputJsonValue,
      },
    });

    return apiSuccess({
      id: updated.id,
      name: updated.name,
      verified: updated.verified,
      verifiedAt: updated.verifiedAt?.toISOString() || null,
      active: updated.active,
    });
  } catch (error) {
    logError("Admin pharmacy verification error:", error);
    return apiError("Failed to update pharmacy", "VERIFICATION_ERROR", 500);
  }
}
