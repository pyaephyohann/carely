import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { updateFulfillmentStatusSchema } from "@/lib/validation";
import { onPharmacyFulfillmentStatusChanged } from "@/lib/notifications/events";

// =============================================================================
// Helper
// =============================================================================

async function getPharmacyForUser(userId: string) {
  const staff = await prisma!.pharmacyStaff.findUnique({
    where: { userId },
    select: { pharmacyId: true },
  });
  return staff?.pharmacyId || null;
}

// =============================================================================
// Status transition rules
// =============================================================================

const VALID_FULFILLMENT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "REJECTED", "CANCELLED"],
  PREPARING: ["READY", "REJECTED"],
  READY: ["COMPLETED"],
};

function canTransition(from: string, to: string): boolean {
  return VALID_FULFILLMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// PATCH /api/prescription-fulfillments/[fulfillmentId]/status
// Update fulfillment status with stock deduction for COMPLETED
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fulfillmentId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requirePharmacy(request);
  if (!auth.authenticated) return auth.response;

  try {
    const pharmacyId = await getPharmacyForUser(auth.user.userId);
    if (!pharmacyId) {
      return apiError("No pharmacy associated with your account", "NOT_FOUND", 404);
    }

    const { fulfillmentId } = await params;
    const body = await request.json();
    const validation = updateFulfillmentStatusSchema.safeParse(body);

    if (!validation.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, {
        validation: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
    }

    const { status: newStatus, rejectReason } = validation.data;

    // Verify ownership
    const fulfillment = await prisma!.prescriptionFulfillment.findFirst({
      where: { id: fulfillmentId, pharmacyId },
      include: {
        items: true,
        prescription: {
          select: { id: true, status: true },
        },
      },
    });

    if (!fulfillment) {
      return apiError("Fulfillment not found", "NOT_FOUND", 404);
    }

    // Validate transition
    if (!canTransition(fulfillment.status, newStatus)) {
      return apiError(
        `Cannot transition from ${fulfillment.status} to ${newStatus}`,
        "INVALID_TRANSITION",
        422,
      );
    }

    // REJECTED requires a reason
    if (newStatus === "REJECTED" && !rejectReason) {
      return apiError("Rejection reason is required", "VALIDATION_ERROR", 400);
    }

    // COMPLETED: deduct stock in a transaction
    if (newStatus === "COMPLETED") {
      const result = await prisma!.$transaction(async (tx) => {
        // BUG-05 FIX: Deduct stock for all items with a linked pharmacyMedicineId.
        // Previously, the check `item.fulfilled` prevented deduction because items
        // were created with `fulfilled: false` and never updated.
        // Now we check `pharmacyMedicineId` (the item is linked to inventory)
        // and set `fulfilled: true` as part of the completion.
        for (const item of fulfillment.items) {
          if (item.pharmacyMedicineId) {
            const inventoryItem = await tx.pharmacyMedicine.findUnique({
              where: { id: item.pharmacyMedicineId },
            });

            if (!inventoryItem) {
              throw new Error(`Inventory item not found for fulfillment item ${item.id}`);
            }

            if (inventoryItem.stock < item.quantity) {
              throw new Error(
                `Insufficient stock for ${item.medicineName}: available ${inventoryItem.stock}, required ${item.quantity}`,
              );
            }

            const newStock = inventoryItem.stock - item.quantity;

            await tx.pharmacyMedicine.update({
              where: { id: item.pharmacyMedicineId },
              data: {
                stock: newStock,
                inStock: newStock > 0,
              },
            });

            await tx.inventoryTransaction.create({
              data: {
                pharmacyMedicineId: item.pharmacyMedicineId,
                type: "FULFILLMENT",
                quantity: -item.quantity,
                previousStock: inventoryItem.stock,
                newStock,
                reason: `Fulfillment #${fulfillmentId}`,
                performedBy: auth.user.userId,
              },
            });
          }

          // Mark fulfillment item as fulfilled
          await tx.prescriptionFulfillmentItem.update({
            where: { id: item.id },
            data: { fulfilled: true },
          });
        }

        // Update fulfillment status
        const updated = await tx.prescriptionFulfillment.update({
          where: { id: fulfillmentId },
          data: { status: newStatus },
        });

        // Mark prescription as COMPLETED
        await tx.prescription.update({
          where: { id: fulfillment.prescriptionId },
          data: { status: "COMPLETED" },
        });

        return updated;
      });

      // BUG-08 FIX: Send notification for COMPLETED status
      const pharmacyForNotif = await prisma!.pharmacy.findUnique({ where: { id: pharmacyId }, select: { name: true } });
      const prescriptionForNotif = await prisma!.prescription.findUnique({ where: { id: fulfillment.prescriptionId }, select: { diagnosis: true } });
      const patientUserIdForNotif = (await prisma!.patient.findUnique({ where: { id: fulfillment.patientId }, select: { userId: true } }))?.userId || "";
      onPharmacyFulfillmentStatusChanged({
        fulfillmentId,
        patientUserId: patientUserIdForNotif,
        pharmacyName: pharmacyForNotif?.name || "Pharmacy",
        status: newStatus,
        prescriptionDiagnosis: prescriptionForNotif?.diagnosis || "",
      }).catch(() => {});

      return apiSuccess({
        id: result.id,
        status: result.status,
        updatedAt: result.updatedAt.toISOString(),
      });
    }

    // REJECTED: also cancel the prescription
    if (newStatus === "REJECTED") {
      await prisma!.$transaction(async (tx) => {
        await tx.prescriptionFulfillment.update({
          where: { id: fulfillmentId },
          data: { status: newStatus, rejectReason },
        });

        // Prescription goes back to FINALIZED so patient can try another pharmacy
        await tx.prescription.update({
          where: { id: fulfillment.prescriptionId },
          data: { status: "FINALIZED" },
        });
      });

      const updated = await prisma!.prescriptionFulfillment.findUnique({
        where: { id: fulfillmentId },
      });

      // BUG-08 FIX: Send notification for REJECTED status
      const pharmacyForReject = await prisma!.pharmacy.findUnique({ where: { id: pharmacyId }, select: { name: true } });
      const prescriptionForReject = await prisma!.prescription.findUnique({ where: { id: fulfillment.prescriptionId }, select: { diagnosis: true } });
      const patientUserIdForReject = (await prisma!.patient.findUnique({ where: { id: fulfillment.patientId }, select: { userId: true } }))?.userId || "";
      onPharmacyFulfillmentStatusChanged({
        fulfillmentId,
        patientUserId: patientUserIdForReject,
        pharmacyName: pharmacyForReject?.name || "Pharmacy",
        status: newStatus,
        prescriptionDiagnosis: prescriptionForReject?.diagnosis || "",
        rejectReason: rejectReason || undefined,
      }).catch(() => {});

      return apiSuccess({
        id: updated!.id,
        status: updated!.status,
        rejectReason: updated!.rejectReason,
        updatedAt: updated!.updatedAt.toISOString(),
      });
    }

    // All other transitions: simple status update
    const updated = await prisma!.prescriptionFulfillment.update({
      where: { id: fulfillmentId },
      data: { status: newStatus },
    });

    // Dispatch notification for all status changes (fire-and-forget)
    const pharmacy = await prisma!.pharmacy.findUnique({ where: { id: pharmacyId }, select: { name: true } });
    const prescription = await prisma!.prescription.findUnique({ where: { id: fulfillment.prescriptionId }, select: { diagnosis: true } });
    onPharmacyFulfillmentStatusChanged({
      fulfillmentId,
      patientUserId: (await prisma!.patient.findUnique({ where: { id: fulfillment.patientId }, select: { userId: true } }))?.userId || "",
      pharmacyName: pharmacy?.name || "Pharmacy",
      status: newStatus,
      prescriptionDiagnosis: prescription?.diagnosis || "",
      rejectReason: rejectReason || undefined,
    }).catch(() => {});

    return apiSuccess({
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    logError("Error updating fulfillment status:", error);
    return apiError("Failed to update status", "INTERNAL_ERROR", 500);
  }
}
