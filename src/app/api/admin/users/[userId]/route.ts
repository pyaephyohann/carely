
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { apiSuccess, apiError, requireDatabase } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireAdmin(request as never);
  if (!auth.authenticated) return auth.response;

  const { userId } = await params;

  try {
    const user = await prisma!.user.findUnique({
      where: { id: userId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            avatar: true,
            _count: { select: { appointments: true, prescriptions: true } },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            licenseNumber: true,
            bio: true,
            consultationFee: true,
            yearsExperience: true,
            verified: true,
            verifiedAt: true,
            rating: true,
            totalReviews: true,
            specialization: { select: { name: true } },
            _count: { select: { appointments: true, consultations: true } },
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        pharmacyStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            pharmacy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      return apiError("User not found", "NOT_FOUND", 404);
    }

    const profile = user.patient
      ? { type: "PATIENT" as const, ...user.patient }
      : user.doctor
        ? { type: "DOCTOR" as const, ...user.doctor }
        : user.admin
          ? { type: "ADMIN" as const, ...user.admin }
          : user.pharmacyStaff
            ? { type: "PHARMACY" as const, ...user.pharmacyStaff }
            : null;

    const name = user.patient
      ? `${user.patient.firstName} ${user.patient.lastName}`
      : user.doctor
        ? `${user.doctor.firstName} ${user.doctor.lastName}`
        : user.admin
          ? `${user.admin.firstName} ${user.admin.lastName}`
          : user.pharmacyStaff
            ? `${user.pharmacyStaff.firstName} ${user.pharmacyStaff.lastName}`
            : user.email;

    return apiSuccess({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      name,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profile,
      patient: user.patient,
      doctor: user.doctor,
      admin: user.admin,
      pharmacyStaff: user.pharmacyStaff,
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return apiError("Failed to load user", "USER_ERROR", 500);
  }
}
