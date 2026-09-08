import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { fetchPatientMedicalRecordDetail } from "@/lib/patient-medical-record-service";

// =============================================================================
// GET /api/patient/medical-records/[recordId]
// View a specific medical record encounter (consultation or standalone record)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { recordId } = await params;

    const patient = await prisma!.patient.findFirst({
      where: { userId: auth.user.userId },
      select: { id: true },
    });

    if (!patient) {
      return apiError("Patient profile not found", "NOT_FOUND", 404);
    }

    const record = await fetchPatientMedicalRecordDetail(prisma!, patient.id, recordId);

    if (!record) {
      return apiError("Medical record not found", "NOT_FOUND", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    logError("Error fetching medical record detail:", error);
    return apiError("Failed to fetch medical record", "INTERNAL_ERROR", 500);
  }
}
