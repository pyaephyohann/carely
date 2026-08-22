import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requireDoctor } from "@/lib/auth-helpers";

// =============================================================================
// GET /api/doctor/availability — List availability exceptions
// =============================================================================

export async function GET(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to");     // YYYY-MM-DD

  const doctor = await prisma!.doctor.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  const where: Record<string, unknown> = { doctorId: doctor.id };
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, Date>).gte = new Date(from);
    if (to) (where.date as Record<string, Date>).lte = new Date(to);
  }

  const exceptions = await prisma!.doctorAvailability.findMany({
    where,
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      available: true,
      startTime: true,
      endTime: true,
      reason: true,
    },
  });

  return apiSuccess(
    exceptions.map((e) => ({
      id: e.id,
      date: e.date.toISOString().split("T")[0],
      available: e.available,
      startTime: e.startTime,
      endTime: e.endTime,
      reason: e.reason,
    })),
  );
}

// =============================================================================
// POST /api/doctor/availability — Create an availability exception
// =============================================================================

export async function POST(request: NextRequest) {
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

  const { date, available, startTime, endTime, reason } = body as {
    date?: string;
    available?: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  };

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError("Valid date is required (YYYY-MM-DD)", "VALIDATION_ERROR", 422);
  }

  if (available && (!startTime || !endTime)) {
    return apiError("startTime and endTime are required when available=true", "VALIDATION_ERROR", 422);
  }

  if (available && startTime && endTime && startTime >= endTime) {
    return apiError("End time must be after start time", "VALIDATION_ERROR", 422);
  }

  const doctor = await prisma!.doctor.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  // Upsert the exception for this date
  const exception = await prisma!.doctorAvailability.upsert({
    where: {
      doctorId_date: {
        doctorId: doctor.id,
        date: new Date(date),
      },
    },
    update: {
      available: available ?? false,
      startTime: available ? startTime : null,
      endTime: available ? endTime : null,
      reason: reason || null,
    },
    create: {
      doctorId: doctor.id,
      date: new Date(date),
      available: available ?? false,
      startTime: available ? startTime : null,
      endTime: available ? endTime : null,
      reason: reason || null,
    },
    select: {
      id: true,
      date: true,
      available: true,
      startTime: true,
      endTime: true,
      reason: true,
    },
  });

  return apiSuccess({
    id: exception.id,
    date: exception.date.toISOString().split("T")[0],
    available: exception.available,
    startTime: exception.startTime,
    endTime: exception.endTime,
    reason: exception.reason,
  }, 201);
}

// =============================================================================
// DELETE /api/doctor/availability — Delete an availability exception
// =============================================================================

export async function DELETE(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);
  const exceptionId = searchParams.get("id");

  if (!exceptionId) {
    return apiError("Exception ID is required", "VALIDATION_ERROR", 422);
  }

  const doctor = await prisma!.doctor.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  // Verify ownership before delete
  const exception = await prisma!.doctorAvailability.findFirst({
    where: { id: exceptionId, doctorId: doctor.id },
  });

  if (!exception) {
    return apiError("Exception not found", "NOT_FOUND", 404);
  }

  await prisma!.doctorAvailability.delete({ where: { id: exceptionId } });

  return apiSuccess({ deleted: true });
}
