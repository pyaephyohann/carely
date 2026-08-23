import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

// =============================================================================
// GET /api/patient/medical-records
// List the authenticated patient's medical records
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
    const skip = (page - 1) * limit;

    const where = { patientId: patient.id };

    const [records, total] = await Promise.all([
      prisma!.medicalRecord.findMany({
        where,
        include: {
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
              diagnosis: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma!.medicalRecord.count({ where }),
    ]);

    return apiSuccess(
      records.map((record) => ({
        id: record.id,
        type: record.type,
        title: record.title,
        description: record.description,
        treatmentPlan: record.treatmentPlan,
        attachments: record.attachments,
        createdAt: record.createdAt.toISOString(),
        doctor: record.doctor
          ? {
              id: record.doctor.id,
              firstName: record.doctor.firstName,
              lastName: record.doctor.lastName,
              specialization: record.doctor.specialization?.name || null,
            }
          : null,
        consultation: record.consultation
          ? {
              id: record.consultation.id,
              diagnosis: record.consultation.diagnosis,
            }
          : null,
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
    logError("Error fetching medical records:", error);
    return apiError("Failed to fetch medical records", "INTERNAL_ERROR", 500);
  }
}
