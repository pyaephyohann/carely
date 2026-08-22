import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { requireDatabase, apiSuccess, apiError } from "@/lib/api";
import { patientProfileSchema } from "@/lib/validation";

// =============================================================================
// GET /api/patient/profile
// =============================================================================

export async function GET(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  const user = await prisma!.user.findUnique({
    where: { id: auth.user.userId },
    include: {
      patient: true,
    },
  });

  if (!user || !user.patient) {
    return apiError("Patient profile not found", "NOT_FOUND", 404);
  }

  return apiSuccess({
    id: user.patient.id,
    userId: user.id,
    email: user.email,
    firstName: user.patient.firstName,
    lastName: user.patient.lastName,
    phone: user.patient.phone,
    dateOfBirth: user.patient.dateOfBirth?.toISOString() || null,
    gender: user.patient.gender,
    address: user.patient.address,
    avatar: user.patient.avatar,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}

// =============================================================================
// PATCH /api/patient/profile
// =============================================================================

export async function PATCH(request: NextRequest) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", "INVALID_BODY", 400);
  }

  const result = patientProfileSchema.safeParse(body);
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

  // Find the patient profile
  const patient = await prisma!.patient.findFirst({
    where: { userId: auth.user.userId },
  });

  if (!patient) {
    return apiError("Patient profile not found", "NOT_FOUND", 404);
  }

  // Update the patient profile
  const updated = await prisma!.patient.update({
    where: { id: patient.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender || null,
      address: data.address || null,
    },
  });

  return apiSuccess({
    id: updated.id,
    userId: auth.user.userId,
    firstName: updated.firstName,
    lastName: updated.lastName,
    phone: updated.phone,
    dateOfBirth: updated.dateOfBirth?.toISOString() || null,
    gender: updated.gender,
    address: updated.address,
    avatar: updated.avatar,
    updatedAt: updated.updatedAt.toISOString(),
  });
}
