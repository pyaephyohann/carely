import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { apiSuccess, apiError, requireDatabase } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireAdmin(request as never);
  if (!auth.authenticated) return auth.response;

  const { doctorId } = await params;

  try {
    const doctor = await prisma!.doctor.findUnique({
      where: { id: doctorId },
      include: {
        specialization: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, status: true, createdAt: true } },
        schedules: {
          select: { dayOfWeek: true, startTime: true, endTime: true, active: true },
          orderBy: { dayOfWeek: "asc" },
        },
        _count: {
          select: {
            appointments: true,
            consultations: true,
            prescriptions: true,
            reviews: true,
          },
        },
      },
    });

    if (!doctor) {
      return apiError("Doctor not found", "NOT_FOUND", 404);
    }

    return apiSuccess({
      id: doctor.id,
      userId: doctor.user.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      phone: doctor.phone,
      avatar: doctor.avatar,
      email: doctor.user.email,
      userStatus: doctor.user.status,
      userCreatedAt: doctor.user.createdAt.toISOString(),
      licenseNumber: doctor.licenseNumber,
      bio: doctor.bio,
      consultationFee: Number(doctor.consultationFee),
      yearsExperience: doctor.yearsExperience,
      appointmentDuration: doctor.appointmentDuration,
      timezone: doctor.timezone,
      verified: doctor.verified,
      verifiedAt: doctor.verifiedAt?.toISOString() || null,
      rating: doctor.rating ? Number(doctor.rating) : null,
      totalReviews: doctor.totalReviews,
      specialization: doctor.specialization,
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
      schedules: doctor.schedules,
      counts: {
        appointments: doctor._count.appointments,
        consultations: doctor._count.consultations,
        prescriptions: doctor._count.prescriptions,
        reviews: doctor._count.reviews,
      },
    });
  } catch (error) {
    logError("Admin doctor detail error:", error);
    return apiError("Failed to load doctor", "DOCTOR_ERROR", 500);
  }
}
