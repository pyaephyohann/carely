import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requireDoctor } from "@/lib/auth-helpers";

// =============================================================================
// GET /api/doctor/appointments/[appointmentId] — Appointment detail
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  const { appointmentId } = await params;

  // Find doctor profile
  const doctor = await prisma!.doctor.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  // Fetch appointment — must belong to this doctor
  const appointment = await prisma!.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
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
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          user: {
            select: { email: true },
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
    patient: {
      id: appointment.patient.id,
      firstName: appointment.patient.firstName,
      lastName: appointment.patient.lastName,
      avatar: appointment.patient.avatar,
      phone: appointment.patient.phone,
      email: appointment.patient.user.email,
      dateOfBirth: appointment.patient.dateOfBirth?.toISOString() || null,
      gender: appointment.patient.gender,
    },
  });
}
