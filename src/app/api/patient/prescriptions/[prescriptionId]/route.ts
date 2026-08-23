import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

// =============================================================================
// GET /api/patient/prescriptions/[prescriptionId]
// View a specific prescription (patient must own it, no drafts)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prescriptionId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { prescriptionId } = await params;

    const patient = await prisma!.patient.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!patient) {
      return apiError("Patient profile not found", "NOT_FOUND", 404);
    }

    const prescription = await prisma!.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: {
          include: { medicine: true },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            specialization: {
              select: { name: true },
            },
          },
        },
        consultation: {
          select: {
            id: true,
            diagnosis: true,
            symptoms: true,
            notes: true,
            followUpDate: true,
            appointment: {
              select: {
                id: true,
                startTime: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      return apiError("Prescription not found", "NOT_FOUND", 404);
    }

    // Authorization: patient must own the prescription and it can't be a draft
    if (prescription.patientId !== patient.id) {
      return apiError("Access denied", "FORBIDDEN", 403);
    }

    if (prescription.status === "DRAFT") {
      return apiError("Prescription not available yet", "NOT_FOUND", 404);
    }

    return apiSuccess({
      id: prescription.id,
      diagnosis: prescription.diagnosis,
      notes: prescription.notes,
      status: prescription.status,
      validUntil: prescription.validUntil?.toISOString() || null,
      createdAt: prescription.createdAt.toISOString(),
      doctor: {
        id: prescription.doctor.id,
        firstName: prescription.doctor.firstName,
        lastName: prescription.doctor.lastName,
        phone: prescription.doctor.phone,
        specialization: prescription.doctor.specialization?.name || null,
      },
      consultation: prescription.consultation
        ? {
            id: prescription.consultation.id,
            diagnosis: prescription.consultation.diagnosis,
            symptoms: prescription.consultation.symptoms,
            notes: prescription.consultation.notes,
            followUpDate: prescription.consultation.followUpDate?.toISOString() || null,
            appointment: prescription.consultation.appointment
              ? {
                  id: prescription.consultation.appointment.id,
                  startTime: prescription.consultation.appointment.startTime.toISOString(),
                  type: prescription.consultation.appointment.type,
                }
              : null,
          }
        : null,
      items: prescription.items.map((item) => ({
        id: item.id,
        medicineName: item.medicine.name,
        medicineGenericName: item.medicine.genericName,
        medicineCategory: item.medicine.category,
        medicineDescription: item.medicine.description,
        dosageForms: item.medicine.dosageForms,
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
