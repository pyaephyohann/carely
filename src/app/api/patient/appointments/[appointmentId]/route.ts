import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requirePatient } from "@/lib/auth-helpers";

// =============================================================================
// GET /api/patient/appointments/[appointmentId] — Appointment detail
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  const { appointmentId } = await params;

  // Find patient profile
  const patient = await prisma!.patient.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!patient) {
    return apiError("Patient profile not found", "NOT_FOUND", 404);
  }

  // Fetch appointment — must belong to this patient
  const appointment = await prisma!.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId: patient.id,
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      type: true,
      reason: true,
      notes: true,
      cancelReason: true,
      cancelledBy: true,
      cancelledAt: true,
      createdAt: true,
      updatedAt: true,
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          consultationFee: true,
          timezone: true,
          specialization: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!appointment) {
    return apiError("Appointment not found", "NOT_FOUND", 404);
  }

  return apiSuccess({
    id: appointment.id,
    startTime: appointment.startTime.toISOString(),
    endTime: appointment.endTime.toISOString(),
    status: appointment.status,
    type: appointment.type,
    reason: appointment.reason,
    notes: appointment.notes,
    cancelReason: appointment.cancelReason,
    cancelledBy: appointment.cancelledBy,
    cancelledAt: appointment.cancelledAt?.toISOString() || null,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
    doctor: {
      id: appointment.doctor.id,
      firstName: appointment.doctor.firstName,
      lastName: appointment.doctor.lastName,
      avatar: appointment.doctor.avatar,
      phone: appointment.doctor.phone,
      consultationFee: Number(appointment.doctor.consultationFee),
      timezone: appointment.doctor.timezone,
      specialization: appointment.doctor.specialization?.name || null,
    },
  });
}
