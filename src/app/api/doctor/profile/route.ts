import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctor } from "@/lib/auth-helpers";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { doctorProfileSchema } from "@/lib/validation";

function serializeDoctorProfile(
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  },
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatar: string | null;
    specializationId: string | null;
    licenseNumber: string;
    bio: string | null;
    consultationFee: { toNumber?: () => number } | number;
    yearsExperience: number | null;
    timezone: string;
    appointmentDuration: number;
    verified: boolean;
    verifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    specialization: { id: string; name: string; slug: string } | null;
  },
) {
  const fee =
    typeof doctor.consultationFee === "number"
      ? doctor.consultationFee
      : Number(doctor.consultationFee);

  return {
    id: doctor.id,
    userId: user.id,
    email: user.email,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    phone: doctor.phone,
    avatar: doctor.avatar,
    specializationId: doctor.specializationId,
    specialization: doctor.specialization,
    licenseNumber: doctor.licenseNumber,
    bio: doctor.bio,
    consultationFee: fee,
    yearsExperience: doctor.yearsExperience,
    timezone: doctor.timezone,
    appointmentDuration: doctor.appointmentDuration,
    verified: doctor.verified,
    verifiedAt: doctor.verifiedAt?.toISOString() || null,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: doctor.updatedAt.toISOString(),
  };
}

// =============================================================================
// GET /api/doctor/profile — Authenticated doctor's own profile
// =============================================================================

export async function GET(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  const user = await prisma!.user.findUnique({
    where: { id: auth.user.userId },
    include: {
      doctor: {
        include: {
          specialization: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  if (!user?.doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  return apiSuccess(serializeDoctorProfile(user, user.doctor));
}

// =============================================================================
// PATCH /api/doctor/profile — Update authenticated doctor's own profile
// =============================================================================

export async function PATCH(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "INVALID_BODY", 400);
  }

  const result = doctorProfileSchema.safeParse(body);
  if (!result.success) {
    const details: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (!details[key]) details[key] = [];
      details[key].push(issue.message);
    }
    return apiError("Validation failed", "VALIDATION_ERROR", 422, details);
  }

  const data = result.data;

  const doctor = await prisma!.doctor.findFirst({
    where: { userId: auth.user.userId },
    select: { id: true },
  });

  if (!doctor) {
    return apiError("Doctor profile not found", "NOT_FOUND", 404);
  }

  if (data.specializationId) {
    const specialization = await prisma!.specialization.findUnique({
      where: { id: data.specializationId },
      select: { id: true },
    });
    if (!specialization) {
      return apiError("Invalid specialization", "VALIDATION_ERROR", 422);
    }
  }

  const licenseTaken = await prisma!.doctor.findFirst({
    where: {
      licenseNumber: data.licenseNumber,
      id: { not: doctor.id },
    },
    select: { id: true },
  });

  if (licenseTaken) {
    return apiError("License number is already in use", "VALIDATION_ERROR", 422);
  }

  try {
    const updated = await prisma!.doctor.update({
      where: { id: doctor.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        specializationId: data.specializationId ?? undefined,
        licenseNumber: data.licenseNumber,
        bio: data.bio || null,
        consultationFee: data.consultationFee,
        yearsExperience: data.yearsExperience ?? null,
      },
      include: {
        specialization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const user = await prisma!.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return apiError("User not found", "NOT_FOUND", 404);
    }

    return apiSuccess(serializeDoctorProfile(user, updated));
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return apiError("License number is already in use", "VALIDATION_ERROR", 422);
    }
    throw error;
  }
}
