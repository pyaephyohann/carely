import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

// =============================================================================
// GET /api/patient/prescriptions
// List the authenticated patient's prescriptions
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  try {
    const patient = await prisma!.patient.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!patient) {
      return apiError("Patient profile not found", "NOT_FOUND", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status") || undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      patientId: patient.id,
      status: { not: "DRAFT" }, // Patients should not see draft prescriptions
    };
    if (status) where.status = status;

    const [prescriptions, total] = await Promise.all([
      prisma!.prescription.findMany({
        where,
        include: {
          items: {
            include: { medicine: true },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialization: {
                select: { name: true },
              },
            },
          },
          consultation: {
            select: {
              id: true,
              appointment: {
                select: { startTime: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma!.prescription.count({ where }),
    ]);

    return apiSuccess(
      prescriptions.map((rx) => ({
        id: rx.id,
        consultationId: rx.consultationId,
        diagnosis: rx.diagnosis,
        notes: rx.notes,
        status: rx.status,
        validUntil: rx.validUntil?.toISOString() || null,
        createdAt: rx.createdAt.toISOString(),
        doctor: {
          id: rx.doctor.id,
          firstName: rx.doctor.firstName,
          lastName: rx.doctor.lastName,
          specialization: rx.doctor.specialization?.name || null,
        },
        appointmentDate: rx.consultation?.appointment?.startTime?.toISOString() || null,
        itemCount: rx.items.length,
        items: rx.items.map((item) => ({
          id: item.id,
          medicineName: item.medicine.name,
          medicineGenericName: item.medicine.genericName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
        })),
      })),
      {
        status: 200,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    );
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return apiError("Failed to fetch prescriptions", "INTERNAL_ERROR", 500);
  }
}
