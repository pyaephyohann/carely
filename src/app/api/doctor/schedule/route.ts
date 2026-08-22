import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requireDoctor } from "@/lib/auth-helpers";

// =============================================================================
// GET /api/doctor/schedule — Get doctor's weekly schedule
// =============================================================================

export async function GET(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  const doctor = await prisma!.doctor.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  const schedules = await prisma!.doctorSchedule.findMany({
    where: { doctorId: doctor.id },
    orderBy: { dayOfWeek: "asc" },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      active: true,
    },
  });

  return apiSuccess(
    schedules.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      active: s.active,
    })),
  );
}

// =============================================================================
// PUT /api/doctor/schedule — Upsert weekly schedule (batch)
// =============================================================================

interface ScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export async function PUT(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "INVALID_BODY", 400);
  }

  const { schedules } = body as { schedules?: ScheduleEntry[] };

  if (!Array.isArray(schedules)) {
    return apiError("Schedules array is required", "VALIDATION_ERROR", 422);
  }

  // Validate each entry
  for (const s of schedules) {
    if (typeof s.dayOfWeek !== "number" || s.dayOfWeek < 0 || s.dayOfWeek > 6) {
      return apiError("Invalid day of week", "VALIDATION_ERROR", 422);
    }
    if (!/^\d{2}:\d{2}$/.test(s.startTime) || !/^\d{2}:\d{2}$/.test(s.endTime)) {
      return apiError("Invalid time format (HH:mm)", "VALIDATION_ERROR", 422);
    }
    if (s.startTime >= s.endTime && s.active) {
      return apiError("End time must be after start time", "VALIDATION_ERROR", 422);
    }
  }

  const doctor = await prisma!.doctor.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  // Upsert each schedule entry
  const results = await Promise.all(
    schedules.map((s) =>
      prisma!.doctorSchedule.upsert({
        where: {
          doctorId_dayOfWeek: {
            doctorId: doctor.id,
            dayOfWeek: s.dayOfWeek,
          },
        },
        update: {
          startTime: s.startTime,
          endTime: s.endTime,
          active: s.active,
        },
        create: {
          doctorId: doctor.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          active: s.active,
        },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          active: true,
        },
      }),
    ),
  );

  return apiSuccess(
    results
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map((r) => ({
        id: r.id,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        active: r.active,
      })),
  );
}
