import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { generateAvailableSlots } from "@/lib/scheduling";

// =============================================================================
// GET /api/doctors/[doctorId]/availability?date=YYYY-MM-DD
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const { doctorId } = await params;
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return apiError("Valid date parameter required (YYYY-MM-DD)", "INVALID_DATE", 400);
  }

  // Fetch doctor with schedule data
  const doctor = await prisma!.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      timezone: true,
      appointmentDuration: true,
      verified: true,
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
        where: { date: new Date(dateStr) },
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
    return apiError("Doctor not found", "NOT_FOUND", 404);
  }

  // Fetch existing appointments for that date
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

  // BUG-03 FIX: Include ALL non-cancelled appointments when checking slot conflicts.
  // Cancelled appointments still occupy the (doctorId, startTime) unique constraint,
  // so their slots must NOT be reported as available.
  const existingAppointments = await prisma!.appointment.findMany({
    where: {
      doctorId: doctor.id,
      status: { notIn: ["CANCELLED"] },
      startTime: { gte: dayStart, lte: dayEnd },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // Format exceptions
  const exceptions = doctor.availability.map((a) => ({
    date: a.date.toISOString().split("T")[0],
    available: a.available,
    startTime: a.startTime,
    endTime: a.endTime,
  }));

  // Generate slots
  const slots = generateAvailableSlots(
    dateStr,
    doctor.timezone,
    doctor.schedules,
    exceptions,
    existingAppointments.map((a) => ({
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
    })),
    doctor.appointmentDuration,
  );

  return apiSuccess({
    date: dateStr,
    timezone: doctor.timezone,
    appointmentDuration: doctor.appointmentDuration,
    slots,
  });
}
