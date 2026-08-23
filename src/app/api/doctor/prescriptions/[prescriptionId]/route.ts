import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireDoctor } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { prescriptionUpdateSchema } from "@/lib/validation";

// =============================================================================
// GET /api/doctor/prescriptions/[prescriptionId]
// View prescription details (doctor must own the prescription)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prescriptionId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { prescriptionId } = await params;

    const doctor = await prisma!.doctor.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!doctor) {
      return apiError("Doctor profile not found", "NOT_FOUND", 404);
    }

    const prescription = await prisma!.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: {
          include: { medicine: true },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        consultation: {
          select: {
            id: true,
            diagnosis: true,
            symptoms: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    });

    if (!prescription) {
      return apiError("Prescription not found", "NOT_FOUND", 404);
    }

    if (prescription.doctorId !== doctor.id) {
      return apiError("Access denied", "FORBIDDEN", 403);
    }

    return apiSuccess({
      id: prescription.id,
      consultationId: prescription.consultationId,
      diagnosis: prescription.diagnosis,
      notes: prescription.notes,
      status: prescription.status,
      validUntil: prescription.validUntil?.toISOString() || null,
      createdAt: prescription.createdAt.toISOString(),
      updatedAt: prescription.updatedAt.toISOString(),
      patient: {
        id: prescription.patient.id,
        firstName: prescription.patient.firstName,
        lastName: prescription.patient.lastName,
        phone: prescription.patient.phone,
        avatar: prescription.patient.avatar,
      },
      consultation: {
        id: prescription.consultation.id,
        diagnosis: prescription.consultation.diagnosis,
        symptoms: prescription.consultation.symptoms,
        notes: prescription.consultation.notes,
        createdAt: prescription.consultation.createdAt.toISOString(),
      },
      items: prescription.items.map((item) => ({
        id: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicine.name,
        medicineGenericName: item.medicine.genericName,
        medicineCategory: item.medicine.category,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
      })),
    });
  } catch (error) {
    logError("Error fetching prescription:", error);
    return apiError("Failed to fetch prescription", "INTERNAL_ERROR", 500);
  }
}

// =============================================================================
// PATCH /api/doctor/prescriptions/[prescriptionId]
// Update a DRAFT prescription or finalize it. Only allowed if status is DRAFT.
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ prescriptionId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { prescriptionId } = await params;
    const body = await request.json();
    const validation = prescriptionUpdateSchema.safeParse(body);

    if (!validation.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, {
        validation: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
    }

    const doctor = await prisma!.doctor.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!doctor) {
      return apiError("Doctor profile not found", "NOT_FOUND", 404);
    }

    const prescription = await prisma!.prescription.findUnique({
      where: { id: prescriptionId },
      include: { items: true },
    });

    if (!prescription) {
      return apiError("Prescription not found", "NOT_FOUND", 404);
    }

    if (prescription.doctorId !== doctor.id) {
      return apiError("Access denied", "FORBIDDEN", 403);
    }

    // Only DRAFT prescriptions can be updated
    if (prescription.status !== "DRAFT") {
      return apiError(
        `Cannot edit a ${prescription.status.toLowerCase()} prescription`,
        "INVALID_STATUS",
        422,
      );
    }

    const { items, ...fields } = validation.data;

    // If new items provided, validate medicine IDs
    if (items && items.length > 0) {
      const medicineIds = items.map((i) => i.medicineId);
      const validMedicines = await prisma!.medicine.findMany({
        where: { id: { in: medicineIds }, active: true },
        select: { id: true },
      });

      if (validMedicines.length !== medicineIds.length) {
        const foundIds = new Set(validMedicines.map((m) => m.id));
        const invalidIds = medicineIds.filter((id) => !foundIds.has(id));
        return apiError(
          `Invalid or inactive medicine(s): ${invalidIds.join(", ")}`,
          "VALIDATION_ERROR",
          400,
        );
      }
    }

    // Update in transaction
    await prisma!.$transaction(async (tx) => {
      // Update prescription fields
      const rx = await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          ...(fields.diagnosis !== undefined && { diagnosis: fields.diagnosis }),
          ...(fields.notes !== undefined && { notes: fields.notes || null }),
          ...(fields.validUntil !== undefined && {
            validUntil: fields.validUntil ? new Date(fields.validUntil) : null,
          }),
        },
      });

      // Replace items if provided
      if (items) {
        // Delete existing items
        await tx.prescriptionItem.deleteMany({
          where: { prescriptionId },
        });

        // Create new items
        await tx.prescriptionItem.createMany({
          data: items.map((item) => ({
            prescriptionId,
            medicineId: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || null,
          })),
        });
      }

      return rx;
    });

    // Fetch updated prescription with items
    const result = await prisma!.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: {
          include: { medicine: true },
        },
      },
    });

    return apiSuccess({
      id: result!.id,
      consultationId: result!.consultationId,
      diagnosis: result!.diagnosis,
      notes: result!.notes,
      status: result!.status,
      validUntil: result!.validUntil?.toISOString() || null,
      createdAt: result!.createdAt.toISOString(),
      updatedAt: result!.updatedAt.toISOString(),
      items: result!.items.map((item) => ({
        id: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicine.name,
        medicineGenericName: item.medicine.genericName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
      })),
    });
  } catch (error) {
    logError("Error updating prescription:", error);
    return apiError("Failed to update prescription", "INTERNAL_ERROR", 500);
  }
}
