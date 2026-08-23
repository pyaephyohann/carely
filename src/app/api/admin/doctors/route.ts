import { NextResponse } from "next/server";
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
    const search = url.searchParams.get("search") || "";
    const verified = url.searchParams.get("verified"); // "true", "false", or null

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { licenseNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (verified !== null && verified !== undefined && verified !== "") {
      where.verified = verified === "true";
    }

    const [total, doctors] = await Promise.all([
      prisma!.doctor.count({ where }),
      prisma!.doctor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          specialization: { select: { id: true, name: true } },
          user: { select: { id: true, email: true, status: true } },
          _count: {
            select: { appointments: true, consultations: true },
          },
        },
      }),
    ]);

    return apiSuccess(
      doctors.map((d) => ({
        id: d.id,
        userId: d.user.id,
        firstName: d.firstName,
        lastName: d.lastName,
        phone: d.phone,
        avatar: d.avatar,
        email: d.user.email,
        userStatus: d.user.status,
        licenseNumber: d.licenseNumber,
        bio: d.bio,
        consultationFee: Number(d.consultationFee),
        yearsExperience: d.yearsExperience,
        verified: d.verified,
        verifiedAt: d.verifiedAt?.toISOString() || null,
        rating: d.rating ? Number(d.rating) : null,
        totalReviews: d.totalReviews,
        specialization: d.specialization?.name || null,
        createdAt: d.createdAt.toISOString(),
        counts: {
          appointments: d._count.appointments,
          consultations: d._count.consultations,
        },
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
    console.error("Admin doctors error:", error);
    return apiError("Failed to load doctors", "DOCTORS_ERROR", 500);
  }
}
