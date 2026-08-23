
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
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
    const role = url.searchParams.get("role") || "";
    const status = url.searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
        { doctor: { firstName: { contains: search, mode: "insensitive" } } },
        { doctor: { lastName: { contains: search, mode: "insensitive" } } },
        { admin: { firstName: { contains: search, mode: "insensitive" } } },
        { admin: { lastName: { contains: search, mode: "insensitive" } } },
        { pharmacyStaff: { firstName: { contains: search, mode: "insensitive" } } },
        { pharmacyStaff: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const [total, users] = await Promise.all([
      prisma!.user.count({ where }),
      prisma!.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              verified: true,
              specialization: { select: { name: true } },
            },
          },
          admin: { select: { id: true, firstName: true, lastName: true, phone: true } },
          pharmacyStaff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              pharmacy: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return apiSuccess(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        lastLoginAt: u.lastLoginAt?.toISOString() || null,
        createdAt: u.createdAt.toISOString(),
        name: u.patient
          ? `${u.patient.firstName} ${u.patient.lastName}`
          : u.doctor
            ? `${u.doctor.firstName} ${u.doctor.lastName}`
            : u.admin
              ? `${u.admin.firstName} ${u.admin.lastName}`
              : u.pharmacyStaff
                ? `${u.pharmacyStaff.firstName} ${u.pharmacyStaff.lastName}`
                : "Unknown",
        profile: u.patient
          ? { type: "PATIENT" as const, ...u.patient }
          : u.doctor
            ? { type: "DOCTOR" as const, ...u.doctor }
            : u.admin
              ? { type: "ADMIN" as const, ...u.admin }
              : u.pharmacyStaff
                ? { type: "PHARMACY" as const, ...u.pharmacyStaff }
                : null,
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
    logError("Admin users error:", error);
    return apiError("Failed to load users", "USERS_ERROR", 500);
  }
}
