import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";

// =============================================================================
// GET /api/doctors/[doctorId] — Public doctor profile
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const { doctorId } = await params;

  if (!doctorId) {
    return apiError("Doctor ID is required", "MISSING_ID", 400);
  }

  const doctor = await prisma!.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      consultationFee: true,
      yearsExperience: true,
      verified: true,
      verifiedAt: true,
      rating: true,
      totalReviews: true,
      createdAt: true,
      specialization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      schedules: {
        where: { active: true },
        orderBy: { dayOfWeek: "asc" },
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
      },
      user: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!doctor) {
    return apiError("Doctor not found", "NOT_FOUND", 404);
  }

  // Only show active doctors
  if (doctor.user.status !== "ACTIVE") {
    return apiError("Doctor not found", "NOT_FOUND", 404);
  }

  // Fetch recent reviews (up to 5)
  const reviews = await prisma!.review.findMany({
    where: { doctorId: doctor.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return apiSuccess({
    id: doctor.id,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    avatar: doctor.avatar,
    bio: doctor.bio,
    consultationFee: Number(doctor.consultationFee),
    yearsExperience: doctor.yearsExperience,
    verified: doctor.verified,
    verifiedAt: doctor.verifiedAt?.toISOString() || null,
    rating: doctor.rating ? Number(doctor.rating) : null,
    totalReviews: doctor.totalReviews,
    createdAt: doctor.createdAt.toISOString(),
    specialization: doctor.specialization,
    schedules: doctor.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      patientName: `${r.patient.firstName} ${r.patient.lastName.charAt(0)}.`,
    })),
  });
}
