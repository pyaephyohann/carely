import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requirePatient } from "@/lib/auth-helpers";

// =============================================================================
// POST /api/patient/appointments/[appointmentId]/cancel — Cancel an appointment
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  const { appointmentId } = await params;

  // Parse body for optional cancel reason
  let cancelReason: string | undefined;
  try {
    const body = await request.json();
    cancelReason = body?.reason;
  } catch {
    // No body is fine
  }

  // Find patient profile
  const patient = await prisma!.patient.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!patient) {
    return apiError("Patient profile not found", "NOT_FOUND", 404);
  }

  // Find the appointment — must belong to this patient
  const appointment = await prisma!.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId: patient.id,
    },
    select: {
      id: true,
      status: true,
      startTime: true,
    },
  });

  if (!appointment) {
    return apiError("Appointment not found", "NOT_FOUND", 404);
  }

  // Validate cancellation is allowed
  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
    return apiError(
      `Cannot cancel an appointment with status "${appointment.status}".`,
      "INVALID_STATUS_TRANSITION",
      422,
    );
  }

  // Update the appointment
  const updated = await prisma!.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "CANCELLED",
      cancelReason: cancelReason || null,
      cancelledBy: "PATIENT",
      cancelledAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      cancelReason: true,
      cancelledBy: true,
      cancelledAt: true,
    },
  });

  return apiSuccess({
    id: updated.id,
    status: updated.status,
    cancelReason: updated.cancelReason,
    cancelledBy: updated.cancelledBy,
    cancelledAt: updated.cancelledAt?.toISOString() || null,
  });
}
