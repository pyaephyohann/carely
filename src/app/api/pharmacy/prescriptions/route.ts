import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

// =============================================================================
// Helper
// =============================================================================

async function getPharmacyForUser(userId: string) {
  const staff = await prisma!.pharmacyStaff.findUnique({
    where: { userId },
    select: { pharmacyId: true },
  });
  return staff?.pharmacyId || null;
}

// =============================================================================
// GET /api/pharmacy/prescriptions
// List fulfillment requests for the authenticated pharmacy
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requirePharmacy(request);
  if (!auth.authenticated) return auth.response;

  try {
    const pharmacyId = await getPharmacyForUser(auth.user.userId);
    if (!pharmacyId) {
      return apiError("No pharmacy associated with your account", "NOT_FOUND", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status") || undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { pharmacyId };
    if (status) where.status = status;

    const [fulfillments, total] = await Promise.all([
      prisma!.prescriptionFulfillment.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          prescription: {
            select: {
              id: true,
              diagnosis: true,
              createdAt: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: "asc" }, // Oldest first for queue
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
        patient: {
          id: f.patient.id,
          name: `${f.patient.firstName} ${f.patient.lastName}`,
          phone: f.patient.phone,
        },
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
    logError("Error fetching pharmacy prescriptions:", error);
    return apiError("Failed to fetch prescriptions", "INTERNAL_ERROR", 500);
  }
}
