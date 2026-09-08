import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { fetchPatientMedicalRecordSummaries } from "@/lib/patient-medical-record-service";
import { isPatientMedicalRecordFilter } from "@/lib/patient-medical-record-utils";

// =============================================================================
// GET /api/patient/medical-records
// List clinical encounters for the authenticated patient
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  try {
    const patient = await prisma!.patient.findFirst({
      where: { userId: auth.user.userId },
      select: { id: true },
    });

    if (!patient) {
      return apiError("Patient profile not found", "NOT_FOUND", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const filterParam = searchParams.get("filter") || "all";
    const filter = isPatientMedicalRecordFilter(filterParam) ? filterParam : "all";

    const { records, pagination } = await fetchPatientMedicalRecordSummaries(prisma!, patient.id, {
      filter,
      page,
      limit,
    });

    return apiSuccess(records, {
      status: 200,
      pagination,
    });
  } catch (error) {
    logError("Error fetching medical records:", error);
    return apiError("Failed to fetch medical records", "INTERNAL_ERROR", 500);
  }
}
