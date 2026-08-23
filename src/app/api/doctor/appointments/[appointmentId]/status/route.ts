import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requireDoctor } from "@/lib/auth-helpers";
import { isValidTransition } from "@/lib/appointment-utils";
import { onAppointmentConfirmed, onAppointmentCancelled } from "@/lib/notifications/events";
import { cancelAppointmentReminders } from "@/lib/notifications/reminder-service";

// =============================================================================
// PATCH /api/doctor/appointments/[appointmentId]/status — Update appointment status
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

  // Parse body
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

  // Find doctor profile
  const doctor = await prisma!.doctor.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  // Find the appointment
  const appointment = await prisma!.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!appointment) {
    return apiError("Appointment not found", "NOT_FOUND", 404);
  }

  // Validate status transition
  if (!isValidTransition(appointment.status, status)) {
    return apiError(
      `Cannot transition from "${appointment.status}" to "${status}".`,
      "INVALID_STATUS_TRANSITION",
      422,
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = { status };

  if (status === "CANCELLED") {
    updateData.cancelReason = cancelReason || null;
    updateData.cancelledBy = "DOCTOR";
    updateData.cancelledAt = new Date();
  }

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  // Update the appointment
  const updated = await prisma!.appointment.update({
    where: { id: appointment.id },
    data: updateData,
    select: {
      id: true,
      status: true,
      notes: true,
      cancelReason: true,
      cancelledBy: true,
      cancelledAt: true,
      updatedAt: true,
    },
  });

  // Dispatch notifications (fire-and-forget)
  if (status === "CONFIRMED" || status === "CANCELLED") {
    const fullAppt = await prisma!.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        patient: { select: { userId: true, firstName: true, lastName: true } },
        doctor: { select: { firstName: true, lastName: true } },
      },
    });

    if (fullAppt) {
      const dateStr = fullAppt.startTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const timeStr = fullAppt.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

      // Cancel any pending reminders for cancelled appointments
      if (status === "CANCELLED") {
        cancelAppointmentReminders(fullAppt.id).catch(() => {});
      }

      if (status === "CONFIRMED") {
        onAppointmentConfirmed({
          appointmentId: fullAppt.id,
          patientUserId: fullAppt.patient.userId,
          doctorName: `${fullAppt.doctor.firstName} ${fullAppt.doctor.lastName}`,
          date: dateStr,
          time: timeStr,
        }).catch(() => {});
      } else if (status === "CANCELLED") {
        onAppointmentCancelled({
          appointmentId: fullAppt.id,
          recipientUserId: fullAppt.patient.userId,
          cancelledByName: `Dr. ${fullAppt.doctor.firstName} ${fullAppt.doctor.lastName}`,
          date: dateStr,
          time: timeStr,
          reason: cancelReason || undefined,
        }).catch(() => {});
      }
    }
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
