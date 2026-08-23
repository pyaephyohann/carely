import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { apiSuccess, apiError, requireDatabase } from "@/lib/api";

export async function GET(request: Request) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireAdmin(request as never);
  if (!auth.authenticated) return auth.response;

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const status = url.searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (status) where.status = status;

    const [total, appointments] = await Promise.all([
      prisma!.appointment.count({ where }),
      prisma!.appointment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startTime: "desc" },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: { select: { email: true } },
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialization: { select: { name: true } },
            },
          },
          consultation: { select: { id: true, diagnosis: true } },
        },
      }),
    ]);

    return apiSuccess(
      appointments.map((a) => ({
        id: a.id,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        status: a.status,
        type: a.type,
        reason: a.reason,
        createdAt: a.createdAt.toISOString(),
        patient: {
          id: a.patient.id,
          name: `${a.patient.firstName} ${a.patient.lastName}`,
          email: a.patient.user.email,
        },
        doctor: {
          id: a.doctor.id,
          name: `${a.doctor.firstName} ${a.doctor.lastName}`,
          specialization: a.doctor.specialization?.name || null,
        },
        hasConsultation: !!a.consultation,
      })),
      {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    logError("Admin appointments error:", error);
    return apiError("Failed to load appointments", "APPOINTMENTS_ERROR", 500);
  }
}
