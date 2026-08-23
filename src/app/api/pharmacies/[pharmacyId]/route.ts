import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

// =============================================================================
// GET /api/pharmacies/[pharmacyId]
// Public pharmacy detail
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pharmacyId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { pharmacyId } = await params;

    const pharmacy = await prisma!.pharmacy.findFirst({
      where: { id: pharmacyId, active: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        licenseNumber: true,
        verified: true,
        openingHours: true,
        createdAt: true,
        _count: {
          select: { inventories: { where: { inStock: true } } },
        },
      },
    });

    if (!pharmacy) {
      return apiError("Pharmacy not found", "NOT_FOUND", 404);
    }

    return apiSuccess({
      id: pharmacy.id,
      name: pharmacy.name,
      description: pharmacy.description,
      address: pharmacy.address,
      phone: pharmacy.phone,
      email: pharmacy.email,
      logo: pharmacy.logo,
      licenseNumber: pharmacy.licenseNumber,
      verified: pharmacy.verified,
      openingHours: pharmacy.openingHours,
      medicineCount: pharmacy._count.inventories,
      createdAt: pharmacy.createdAt.toISOString(),
    });
  } catch (error) {
    logError("Error fetching pharmacy:", error);
    return apiError("Failed to fetch pharmacy", "INTERNAL_ERROR", 500);
  }
}
