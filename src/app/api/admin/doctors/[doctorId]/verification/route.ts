import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { apiSuccess, apiError, requireDatabase } from "@/lib/api";
import { createNotification } from "@/lib/notifications/notification-service";
import type { NotificationType } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireAdmin(request as never);
  if (!auth.authenticated) return auth.response;

  const { doctorId } = await params;

  try {
    const body = await request.json();
    const { verified } = body;

    if (typeof verified !== "boolean") {
      return apiError("Invalid verification status", "VALIDATION_ERROR", 400, {
        verified: ["Must be true or false"],
      });
    }

    const doctor = await prisma!.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userId: true,
        verified: true,
      },
    });

    if (!doctor) {
      return apiError("Doctor not found", "NOT_FOUND", 404);
    }

    if (doctor.verified === verified) {
      return apiError(
        verified ? "Doctor is already verified" : "Doctor is already unverified",
        "NO_CHANGE",
        400
      );
    }

    const updated = await prisma!.doctor.update({
      where: { id: doctorId },
      data: {
        verified,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? auth.user.userId : null,
      },
      select: {
        id: true,
        verified: true,
        verifiedAt: true,
      },
    });

    // Create notification for the doctor
    try {
      await createNotification({
        userId: doctor.userId,
        type: (verified ? "DOCTOR_VERIFIED" : "SYSTEM") as NotificationType,
        title: verified ? "Account Verified" : "Verification Updated",
        message: verified
          ? `Your doctor account has been verified by the platform administrator.`
          : `Your doctor verification status has been updated.`,
        link: "/doctor/profile",
      });
    } catch {
      // Notification failure should not break the verification
    }

    // Audit log
    await prisma!.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "VERIFY_DOCTOR",
        entityType: "Doctor",
        entityId: doctorId,
        metadata: {
          action: verified ? "VERIFY" : "UNVERIFY",
          doctorName: `${doctor.firstName} ${doctor.lastName}`,
        },
      },
    });

    return apiSuccess({
      id: updated.id,
      verified: updated.verified,
      verifiedAt: updated.verifiedAt?.toISOString() || null,
    });
  } catch (error) {
    logError("Admin doctor verification error:", error);
    return apiError("Failed to update verification", "VERIFICATION_ERROR", 500);
  }
}
