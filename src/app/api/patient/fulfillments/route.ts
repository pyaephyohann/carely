import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

// =============================================================================
// GET /api/patient/fulfillments
// List the authenticated patient's fulfillment requests
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requirePatient(request);
  if (!auth.authenticated) return auth.response;

  try {
    const patient = await prisma!.patient.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!patient) {
      return apiError("Patient profile not found", "NOT_FOUND", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status") || undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { patientId: patient.id };
    if (status) where.status = status;

    const [fulfillments, total] = await Promise.all([
      prisma!.prescriptionFulfillment.findMany({
        where,
        include: {
          pharmacy: { select: { id: true, name: true, address: true, phone: true } },
          prescription: {
            select: {
              id: true,
              diagnosis: true,
              createdAt: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma!.prescriptionFulfillment.count({ where }),
    ]);

    return apiSuccess(
      fulfillments.map((f) => ({
        id: f.id,
        status: f.status,
        rejectReason: f.rejectReason,
        pharmacy: f.pharmacy,
        prescription: f.prescription,
        itemCount: f.items.length,
        fulfilledCount: f.items.filter((i) => i.fulfilled).length,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      {
        status: 200,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    );
  } catch (error) {
    logError("Error fetching patient fulfillments:", error);
    return apiError("Failed to fetch fulfillments", "INTERNAL_ERROR", 500);
  }
}
