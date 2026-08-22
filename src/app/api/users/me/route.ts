import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const dbCheck = requireDatabase();
    if (dbCheck) return dbCheck;

    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    const user = await prisma!.user.findUnique({
      where: { id: auth.user.userId },
      include: {
        patient: true,
        doctor: {
          include: {
            specialization: true,
          },
        },
        admin: true,
      },
    });

    if (!user || user.deletedAt) {
      return apiError("User not found", "USER_NOT_FOUND", 404);
    }

    // Build profile based on role
    const profile =
      user.role === "PATIENT"
        ? user.patient
        : user.role === "DOCTOR"
          ? user.doctor
          : user.admin;

    return apiSuccess({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profile: profile
        ? { ...profile, createdAt: profile.createdAt.toISOString(), updatedAt: profile.updatedAt.toISOString() }
        : null,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return apiError("An unexpected error occurred");
  }
}
