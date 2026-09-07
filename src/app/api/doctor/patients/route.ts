import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireDoctor } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { computePatientAge } from "@/lib/doctor-patient-utils";
import {
  buildPatientSearchFilter,
  fetchPatientListAggregates,
  getDoctorProfileId,
  getLinkedPatientIds,
} from "@/lib/doctor-patient-service";

// =============================================================================
// GET /api/doctor/patients
// Patients linked to the authenticated doctor via appointments (unique, no dupes)
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  try {
    const doctor = await getDoctorProfileId(auth.user.userId);
    if (!doctor) {
      return apiError("Doctor profile not found", "NOT_FOUND", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("q") || undefined;
    const skip = (page - 1) * limit;
    const now = new Date();

    const linkedPatientIds = await getLinkedPatientIds(doctor.id);
    if (linkedPatientIds.length === 0) {
      return apiSuccess([], {
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const searchFilter = buildPatientSearchFilter(search);
    const where = {
      id: { in: linkedPatientIds },
      ...(searchFilter ?? {}),
    };

    const [patients, total] = await Promise.all([
      prisma!.patient.findMany({
        where,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          avatar: true,
          user: { select: { email: true } },
        },
      }),
      prisma!.patient.count({ where }),
    ]);

    const patientIds = patients.map((p) => p.id);
    const aggregates = await fetchPatientListAggregates(doctor.id, patientIds, now);

    return apiSuccess(
      patients.map((patient) => {
        const last = aggregates.lastAppointments.get(patient.id);
        const next = aggregates.nextAppointments.get(patient.id);

        return {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          fullName: `${patient.firstName} ${patient.lastName}`,
          phone: patient.phone,
          email: patient.user.email,
          avatar: patient.avatar,
          dateOfBirth: patient.dateOfBirth?.toISOString() || null,
          age: computePatientAge(patient.dateOfBirth),
          gender: patient.gender,
          appointmentCount: aggregates.appointmentCounts.get(patient.id) ?? 0,
          prescriptionCount: aggregates.prescriptionCounts.get(patient.id) ?? 0,
          lastAppointment: last
            ? {
                id: last.id,
                startTime: last.startTime.toISOString(),
                status: last.status,
              }
            : null,
          nextAppointment: next
            ? {
                id: next.id,
                startTime: next.startTime.toISOString(),
                status: next.status,
              }
            : null,
        };
      }),
      {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    );
  } catch (error) {
    logError("Error fetching doctor patients:", error);
    return apiError("Failed to fetch patients", "INTERNAL_ERROR", 500);
  }
}
