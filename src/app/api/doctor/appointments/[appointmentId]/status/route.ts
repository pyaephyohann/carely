import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requireDoctor } from "@/lib/auth-helpers";
import { isValidTransition, DOCTOR_REJECT_REASON } from "@/lib/appointment-utils";
import { onAppointmentConfirmed, onAppointmentCancelled } from "@/lib/notifications/events";
import {
  cancelAppointmentReminders,
  scheduleAppointmentReminders,
} from "@/lib/notifications/reminder-service";

// =============================================================================
// PATCH /api/doctor/appointments/[appointmentId]/status — Update appointment status
// Doctor identity from session; transitions enforced server-side.
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  const { appointmentId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "INVALID_BODY", 400);
  }

  const { status, notes, cancelReason } = body as {
    status?: string;
    notes?: string;
    cancelReason?: string;
  };

  if (!status || typeof status !== "string") {
    return apiError("Status is required", "VALIDATION_ERROR", 422);
  }

  const validStatuses = ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
  if (!validStatuses.includes(status)) {
    return apiError(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      "VALIDATION_ERROR",
      422,
    );
  }

  const doctor = await prisma!.doctor.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  const appointment = await prisma!.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
    select: {
      id: true,
      status: true,
      startTime: true,
      patient: {
        select: {
          userId: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!appointment) {
    return apiError("Appointment not found", "NOT_FOUND", 404);
  }

  if (!isValidTransition(appointment.status, status)) {
    return apiError(
      `Cannot transition from "${appointment.status}" to "${status}".`,
      "INVALID_STATUS_TRANSITION",
      422,
    );
  }

  const updateData: Record<string, unknown> = { status };

  if (status === "CANCELLED") {
    const isReject = appointment.status === "PENDING";
    updateData.cancelReason =
      cancelReason || (isReject ? DOCTOR_REJECT_REASON : null);
    updateData.cancelledBy = "DOCTOR";
    updateData.cancelledAt = new Date();
  }

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  // Atomic conditional update — prevents race overwrites if status already changed
  const updateResult = await prisma!.appointment.updateMany({
    where: {
      id: appointment.id,
      doctorId: doctor.id,
      status: appointment.status,
    },
    data: updateData,
  });

  if (updateResult.count === 0) {
    return apiError(
      "Appointment status was already changed. Please refresh and try again.",
      "CONFLICT",
      409,
    );
  }

  const updated = await prisma!.appointment.findUnique({
    where: { id: appointment.id },
    select: {
      id: true,
      status: true,
      notes: true,
      cancelReason: true,
      cancelledBy: true,
      cancelledAt: true,
      updatedAt: true,
      startTime: true,
    },
  });

  if (!updated) {
    return apiError("Appointment not found after update", "NOT_FOUND", 404);
  }

  const dateStr = updated.startTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = updated.startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const doctorName = `${doctor.firstName} ${doctor.lastName}`;
  const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;

  if (status === "CONFIRMED") {
    onAppointmentConfirmed({
      appointmentId: updated.id,
      patientUserId: appointment.patient.userId,
      doctorName,
      date: dateStr,
      time: timeStr,
    }).catch(() => {});

    scheduleAppointmentReminders({
      appointmentId: updated.id,
      patientUserId: appointment.patient.userId,
      doctorName,
      patientName,
      appointmentTime: updated.startTime,
    }).catch(() => {});
  } else if (status === "CANCELLED") {
    cancelAppointmentReminders(updated.id).catch(() => {});
    onAppointmentCancelled({
      appointmentId: updated.id,
      recipientUserId: appointment.patient.userId,
      cancelledByName: `Dr. ${doctorName}`,
      date: dateStr,
      time: timeStr,
      reason: (updateData.cancelReason as string | null) || undefined,
    }).catch(() => {});
  }

  return apiSuccess({
    id: updated.id,
    status: updated.status,
    notes: updated.notes,
    cancelReason: updated.cancelReason,
    cancelledBy: updated.cancelledBy,
    cancelledAt: updated.cancelledAt?.toISOString() || null,
    updatedAt: updated.updatedAt.toISOString(),
  });
}
