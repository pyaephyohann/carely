import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requireDoctor } from "@/lib/auth-helpers";

// =============================================================================
// GET /api/doctor/appointments — List doctor's appointments
// =============================================================================

export async function GET(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "upcoming";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  // Find doctor profile
  const doctor = await prisma!.doctor.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  const now = new Date();

  // Build where clause
  const where: Record<string, unknown> = {
    doctorId: doctor.id,
  };

  switch (filter) {
    case "today":
      const todayStart = new Date(now);
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setUTCHours(23, 59, 59, 999);
      where.startTime = { gte: todayStart, lte: todayEnd };
      where.status = { in: ["PENDING", "CONFIRMED"] };
      break;
    case "upcoming":
      where.startTime = { gte: now };
      where.status = { in: ["PENDING", "CONFIRMED"] };
      break;
    case "past":
      where.OR = [
        { startTime: { lt: now } },
        { status: { in: ["COMPLETED", "NO_SHOW"] } },
      ];
      where.status = { notIn: ["CANCELLED"] };
      break;
    case "cancelled":
      where.status = "CANCELLED";
      break;
    // "all" — no additional filters
  }

  const [appointments, total] = await Promise.all([
    prisma!.appointment.findMany({
      where,
      orderBy: { startTime: filter === "past" ? "desc" : "asc" },
      skip,
      take: limit,
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
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
          },
        },
      },
    }),
    prisma!.appointment.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return apiSuccess(
    appointments.map((a) => ({
      id: a.id,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      status: a.status,
      type: a.type,
      reason: a.reason,
      notes: a.notes,
      cancelReason: a.cancelReason,
      cancelledBy: a.cancelledBy,
      cancelledAt: a.cancelledAt?.toISOString() || null,
      createdAt: a.createdAt.toISOString(),
      patient: {
        id: a.patient.id,
        firstName: a.patient.firstName,
        lastName: a.patient.lastName,
        avatar: a.patient.avatar,
        phone: a.patient.phone,
      },
    })),
    { pagination: { page, limit, total, totalPages } },
  );
}
