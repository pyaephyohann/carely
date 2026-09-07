import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { requireDoctor } from "@/lib/auth-helpers";
import { logError } from "@/lib/logger";

const appointmentSelect = {
  id: true,
  startTime: true,
  endTime: true,
  status: true,
  type: true,
  reason: true,
  notes: true,
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
} as const;

type AppointmentRow = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  type: string;
  reason: string | null;
  notes: string | null;
  createdAt: Date;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    phone: string | null;
  };
};

function serializeAppointment(a: AppointmentRow) {
  return {
    id: a.id,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status,
    type: a.type,
    reason: a.reason,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
    patient: {
      id: a.patient.id,
      firstName: a.patient.firstName,
      lastName: a.patient.lastName,
      avatar: a.patient.avatar,
      phone: a.patient.phone,
    },
  };
}

/** UTC day bounds — matches /api/doctor/appointments?filter=today */
function getUtcDayBounds(now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

// =============================================================================
// GET /api/doctor/dashboard — Aggregated dashboard for the authenticated doctor
// Doctor identity is ALWAYS derived from the session (requireDoctor + userId).
// =============================================================================

export async function GET(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  try {
    const doctor = await prisma!.doctor.findFirst({
      where: { userId: auth.user.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        timezone: true,
      },
    });

    if (!doctor) {
      return apiError("Doctor profile not found", "NOT_FOUND", 404);
    }

    const now = new Date();
    const { start: todayStart, end: todayEnd } = getUtcDayBounds(now);
    const doctorId = doctor.id;

    const [
      todayCount,
      pendingCount,
      completedCount,
      patientGroups,
      todaySchedule,
      pendingRequests,
      upcomingAppointments,
      recentAppointmentRows,
      nextAppointment,
    ] = await Promise.all([
      prisma!.appointment.count({
        where: {
          doctorId,
          startTime: { gte: todayStart, lte: todayEnd },
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
        },
      }),
      prisma!.appointment.count({
        where: { doctorId, status: "PENDING" },
      }),
      prisma!.appointment.count({
        where: { doctorId, status: "COMPLETED" },
      }),
      prisma!.appointment.groupBy({
        by: ["patientId"],
        where: {
          doctorId,
          status: { notIn: ["CANCELLED"] },
        },
      }),
      prisma!.appointment.findMany({
        where: {
          doctorId,
          startTime: { gte: todayStart, lte: todayEnd },
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW"] },
        },
        orderBy: { startTime: "asc" },
        take: 20,
        select: appointmentSelect,
      }),
      prisma!.appointment.findMany({
        where: { doctorId, status: "PENDING" },
        orderBy: { startTime: "asc" },
        take: 10,
        select: appointmentSelect,
      }),
      prisma!.appointment.findMany({
        where: {
          doctorId,
          startTime: { gte: now },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        orderBy: { startTime: "asc" },
        take: 5,
        select: appointmentSelect,
      }),
      prisma!.appointment.findMany({
        where: {
          doctorId,
          status: { notIn: ["CANCELLED"] },
        },
        orderBy: { startTime: "desc" },
        take: 30,
        select: appointmentSelect,
      }),
      prisma!.appointment.findFirst({
        where: {
          doctorId,
          startTime: { gte: now },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        orderBy: { startTime: "asc" },
        select: appointmentSelect,
      }),
    ]);

    // Deduplicate recent patients by most recent appointment
    const seenPatients = new Set<string>();
    const recentPatients: Array<{
      patient: AppointmentRow["patient"];
      lastAppointmentId: string;
      lastAppointmentAt: string;
      lastStatus: string;
      lastType: string;
    }> = [];

    for (const row of recentAppointmentRows) {
      if (seenPatients.has(row.patient.id)) continue;
      seenPatients.add(row.patient.id);
      recentPatients.push({
        patient: row.patient,
        lastAppointmentId: row.id,
        lastAppointmentAt: row.startTime.toISOString(),
        lastStatus: row.status,
        lastType: row.type,
      });
      if (recentPatients.length >= 8) break;
    }

    return apiSuccess({
      doctor: {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        avatar: doctor.avatar,
        timezone: doctor.timezone,
      },
      stats: {
        todayAppointments: todayCount,
        pendingRequests: pendingCount,
        completedAppointments: completedCount,
        totalPatients: patientGroups.length,
      },
      nextAppointment: nextAppointment ? serializeAppointment(nextAppointment) : null,
      todaySchedule: todaySchedule.map(serializeAppointment),
      pendingRequests: pendingRequests.map(serializeAppointment),
      upcomingAppointments: upcomingAppointments.map(serializeAppointment),
      recentPatients,
    });
  } catch (error) {
    logError("Doctor dashboard error", error);
    return apiError("Failed to load dashboard data", "DASHBOARD_ERROR", 500);
  }
}
