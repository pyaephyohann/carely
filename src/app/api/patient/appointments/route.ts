import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requirePatient } from "@/lib/auth-helpers";

// =============================================================================
// GET /api/patient/appointments — List patient's appointments
// =============================================================================

export async function GET(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "upcoming"; // upcoming, pending, completed, cancelled, past, all
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  // Find patient profile — identity ALWAYS from session, never from query params
  const patient = await prisma!.patient.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!patient) {
    return apiError("Patient profile not found", "NOT_FOUND", 404);
  }

  const now = new Date();

  // Build where clause based on filter (server-side; scoped to authenticated patient)
  const where: Record<string, unknown> = {
    patientId: patient.id,
  };

  switch (filter) {
    case "upcoming":
      where.startTime = { gte: now };
      where.status = { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] };
      break;
    case "pending":
      where.status = "PENDING";
      break;
    case "completed":
      where.status = "COMPLETED";
      break;
    case "cancelled":
      where.status = "CANCELLED";
      break;
    case "past":
      where.AND = [
        { status: { notIn: ["CANCELLED"] } },
        {
          OR: [
            { startTime: { lt: now } },
            { status: { in: ["COMPLETED", "NO_SHOW"] } },
          ],
        },
      ];
      break;
    // "all" — no additional filters
  }

  const orderBy =
    filter === "past" || filter === "completed" || filter === "cancelled"
      ? { startTime: "desc" as const }
      : { startTime: "asc" as const };

  const [appointments, total] = await Promise.all([
    prisma!.appointment.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        type: true,
        reason: true,
        cancelReason: true,
        cancelledBy: true,
        cancelledAt: true,
        createdAt: true,
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            specialization: {
              select: { name: true },
            },
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
      cancelReason: a.cancelReason,
      cancelledBy: a.cancelledBy,
      cancelledAt: a.cancelledAt?.toISOString() || null,
      createdAt: a.createdAt.toISOString(),
      doctor: {
        id: a.doctor.id,
        firstName: a.doctor.firstName,
        lastName: a.doctor.lastName,
        avatar: a.doctor.avatar,
        specialization: a.doctor.specialization?.name || null,
      },
    })),
    { pagination: { page, limit, total, totalPages } },
  );
}
