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
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [
      totalPatients,
      totalDoctors,
      totalPharmacies,
      pendingDoctors,
      pendingPharmacies,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      totalPrescriptions,
      activePrescriptions,
      pendingFulfillments,
      completedFulfillments,
      recentUsers,
      pendingVerifications,
    ] = await Promise.all([
      prisma!.patient.count(),
      prisma!.doctor.count(),
      prisma!.pharmacy.count({ where: { deletedAt: null } }),
      prisma!.doctor.count({ where: { verified: false } }),
      prisma!.pharmacy.count({ where: { verified: false, deletedAt: null } }),
      prisma!.appointment.count(),
      prisma!.appointment.count({
        where: {
          startTime: { gte: startOfDay, lt: endOfDay },
        },
      }),
      prisma!.appointment.count({ where: { status: "PENDING" } }),
      prisma!.prescription.count(),
      prisma!.prescription.count({ where: { status: "ACTIVE" } }),
      prisma!.prescriptionFulfillment.count({ where: { status: "PENDING" } }),
      prisma!.prescriptionFulfillment.count({ where: { status: "COMPLETED" } }),
      prisma!.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { firstName: true, lastName: true } },
          admin: { select: { firstName: true, lastName: true } },
          pharmacyStaff: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma!.doctor.findMany({
        where: { verified: false },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          licenseNumber: true,
          specialization: { select: { name: true } },
          createdAt: true,
        },
      }),
    ]);

    return apiSuccess({
      metrics: {
        totalPatients,
        totalDoctors,
        totalPharmacies,
        pendingDoctors,
        pendingPharmacies,
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        totalPrescriptions,
        activePrescriptions,
        pendingFulfillments,
        completedFulfillments,
      },
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        name:
          u.patient
            ? `${u.patient.firstName} ${u.patient.lastName}`
            : u.doctor
              ? `${u.doctor.firstName} ${u.doctor.lastName}`
              : u.admin
                ? `${u.admin.firstName} ${u.admin.lastName}`
                : u.pharmacyStaff
                  ? `${u.pharmacyStaff.firstName} ${u.pharmacyStaff.lastName}`
                  : "Unknown",
      })),
      pendingVerifications: pendingVerifications.map((d) => ({
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        licenseNumber: d.licenseNumber,
        specialization: d.specialization?.name || null,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logError("Admin dashboard error:", error);
    return apiError("Failed to load dashboard data", "DASHBOARD_ERROR", 500);
  }
}
