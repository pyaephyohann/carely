import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requirePatient } from "@/lib/auth-helpers";
import { generateAvailableSlots } from "@/lib/scheduling";
import { onAppointmentBooked } from "@/lib/notifications/events";
import { scheduleAppointmentReminders } from "@/lib/notifications/reminder-service";
import { Prisma } from "@prisma/client";

// =============================================================================
// POST /api/appointments — Create an appointment (with transaction)
// =============================================================================

export async function POST(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "INVALID_BODY", 400);
  }

  const { doctorId, date, startTime, type, reason } = body as {
    doctorId?: string;
    date?: string;
    startTime?: string;
    type?: string;
    reason?: string;
  };

  // Validate required fields
  if (!doctorId || typeof doctorId !== "string") {
    return apiError("Doctor ID is required", "VALIDATION_ERROR", 422);
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError("Valid date is required (YYYY-MM-DD)", "VALIDATION_ERROR", 422);
  }
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
    return apiError("Valid start time is required (HH:mm)", "VALIDATION_ERROR", 422);
  }
  if (type && !["IN_PERSON", "VIRTUAL"].includes(type)) {
    return apiError("Invalid appointment type", "VALIDATION_ERROR", 422);
  }

  // Find patient profile
  const patient = await prisma!.patient.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true, user: { select: { status: true } } },
  });

  if (!patient || patient.user.status !== "ACTIVE") {
    return apiError("Patient profile not found", "NOT_FOUND", 404);
  }

  // Transaction: validate + book atomically
  try {
    const result = await prisma!.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Fetch doctor with schedule data
      const doctor = await tx.doctor.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          timezone: true,
          appointmentDuration: true,
          user: { select: { status: true } },
          schedules: {
            select: {
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              active: true,
            },
          },
          availability: {
            where: { date: new Date(date) },
            select: {
              date: true,
              available: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      });

      if (!doctor || doctor.user.status !== "ACTIVE") {
        throw new AppError("Doctor not found or not available", "DOCTOR_NOT_FOUND", 404);
      }

      // 2. Validate slot availability
      const exceptions = doctor.availability.map((a) => ({
        date: a.date.toISOString().split("T")[0],
        available: a.available,
        startTime: a.startTime,
        endTime: a.endTime,
      }));

      const availableSlots = generateAvailableSlots(
        date,
        doctor.timezone,
        doctor.schedules,
        exceptions,
        [], // We'll check conflicts in the transaction
        doctor.appointmentDuration,
      );

      // 3. Check if the requested slot is among available slots
      const matchingSlot = availableSlots.find(
        (s) => s.localStartTime === startTime,
      );

      if (!matchingSlot) {
        throw new AppError(
          "This time slot is not available. Please choose another time.",
          "SLOT_UNAVAILABLE",
          409,
        );
      }

      // 4. Check for conflicts with existing bookings (within transaction)
      const conflictCount = await tx.appointment.count({
        where: {
          doctorId: doctor.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          OR: [
            {
              startTime: { lt: new Date(matchingSlot.endTime) },
              endTime: { gt: new Date(matchingSlot.startTime) },
            },
          ],
        },
      });

      if (conflictCount > 0) {
        throw new AppError(
          "This time slot has just been booked. Please choose another time.",
          "SLOT_CONFLICT",
          409,
        );
      }

      // 5. Create the appointment
      const appointment = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          startTime: new Date(matchingSlot.startTime),
          endTime: new Date(matchingSlot.endTime),
          status: "CONFIRMED",
          type: (type as "IN_PERSON" | "VIRTUAL") || "IN_PERSON",
          reason: reason || null,
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
          type: true,
          reason: true,
          createdAt: true,
        },
      });

      return appointment;
    });

    // Fetch doctor and patient names for notification
    const [doctorData, patientData] = await Promise.all([
      prisma!.doctor.findUnique({ where: { id: doctorId }, select: { firstName: true, lastName: true, userId: true } }),
      prisma!.patient.findUnique({ where: { id: patient.id }, select: { firstName: true, lastName: true } }),
    ]);

    // Dispatch notifications (fire-and-forget, must not block response)
    if (doctorData && patientData) {
      const dateStr = new Date(result.startTime).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const timeStr = new Date(result.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      onAppointmentBooked({
        appointmentId: result.id,
        patientId: patient.id,
        doctorId: doctorId!,
        patientUserId: auth.user.userId,
        doctorUserId: doctorData.userId,
        doctorName: `${doctorData.firstName} ${doctorData.lastName}`,
        patientName: `${patientData.firstName} ${patientData.lastName}`,
        date: dateStr,
        time: timeStr,
        type: result.type || "IN_PERSON",
      }).catch(() => {});

      // Schedule reminders (fire-and-forget)
      scheduleAppointmentReminders({
        appointmentId: result.id,
        patientUserId: auth.user.userId,
        doctorName: `${doctorData.firstName} ${doctorData.lastName}`,
        patientName: `${patientData.firstName} ${patientData.lastName}`,
        appointmentTime: result.startTime,
      }).catch(() => {});
    }

    return apiSuccess({
      id: result.id,
      doctorId,
      patientId: patient.id,
      startTime: result.startTime.toISOString(),
      endTime: result.endTime.toISOString(),
      status: result.status,
      type: result.type,
      reason: result.reason,
      createdAt: result.createdAt.toISOString(),
    }, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.message, error.code, error.status);
    }
    // Handle Prisma unique constraint violation (race condition)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint") &&
      error.message.includes("appointments")
    ) {
      return apiError(
        "This time slot has just been booked. Please choose another time.",
        "SLOT_CONFLICT",
        409,
      );
    }
    console.error("Booking error:", error);
    return apiError("Failed to create appointment", "BOOKING_FAILED", 500);
  }
}

// Custom error class for transaction flow
class AppError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
