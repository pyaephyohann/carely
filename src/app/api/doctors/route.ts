import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiSuccess } from "@/lib/api";
import { Prisma } from "@prisma/client";

// =============================================================================
// GET /api/doctors — Public doctor listing with search, filter, pagination
// =============================================================================

export async function GET(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || undefined;
  const specialization = searchParams.get("specialization") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
  const sortBy = searchParams.get("sortBy") || "rating";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // Build Prisma where clause
  const where: Prisma.DoctorWhereInput = {
    user: { status: "ACTIVE" },
  };

  // Search by doctor name or specialization name
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { specialization: { name: { contains: search, mode: "insensitive" } } },
      { bio: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter by specialization
  if (specialization) {
    where.specialization = {
      slug: specialization,
    };
  }

  // Build orderBy
  let orderBy: Prisma.DoctorOrderByWithRelationInput;
  switch (sortBy) {
    case "fee":
      orderBy = { consultationFee: sortOrder === "asc" ? "asc" : "desc" };
      break;
    case "experience":
      orderBy = { yearsExperience: sortOrder === "asc" ? "asc" : "desc" };
      break;
    case "rating":
    default:
      orderBy = { rating: sortOrder === "asc" ? "asc" : "desc" };
      break;
  }

  const skip = (page - 1) * limit;

  const [doctors, total] = await Promise.all([
    prisma!.doctor.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        consultationFee: true,
        yearsExperience: true,
        verified: true,
        rating: true,
        totalReviews: true,
        specialization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        schedules: {
          where: { active: true },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    }),
    prisma!.doctor.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return apiSuccess(
    doctors.map((d) => ({
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      avatar: d.avatar,
      bio: d.bio,
      consultationFee: Number(d.consultationFee),
      yearsExperience: d.yearsExperience,
      verified: d.verified,
      rating: d.rating ? Number(d.rating) : null,
      totalReviews: d.totalReviews,
      specialization: d.specialization,
      scheduleSummary: d.schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    })),
    {
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
  );
}
