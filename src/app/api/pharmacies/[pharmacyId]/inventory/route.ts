import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

// =============================================================================
// GET /api/pharmacies/[pharmacyId]/inventory
// Public view of pharmacy inventory (medicine availability)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pharmacyId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { pharmacyId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Verify pharmacy exists
    const pharmacy = await prisma!.pharmacy.findFirst({
      where: { id: pharmacyId, active: true, deletedAt: null },
    });

    if (!pharmacy) {
      return apiError("Pharmacy not found", "NOT_FOUND", 404);
    }

    const where: Record<string, unknown> = {
      pharmacyId,
      inStock: true,
    };

    if (search || category) {
      where.medicine = {};
      const medicineFilters: Record<string, unknown>[] = [];
      if (search) {
        medicineFilters.push(
          { name: { contains: search, mode: "insensitive" } },
          { genericName: { contains: search, mode: "insensitive" } },
        );
      }
      if (category) {
        medicineFilters.push({ category: { contains: category, mode: "insensitive" } });
      }
      if (medicineFilters.length === 1) {
        where.medicine = medicineFilters[0];
      } else {
        where.medicine = { OR: medicineFilters };
      }
    }

    const [items, total] = await Promise.all([
      prisma!.pharmacyMedicine.findMany({
        where,
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              genericName: true,
              category: true,
              description: true,
              dosageForms: true,
            },
          },
        },
        orderBy: { medicine: { name: "asc" } },
        skip,
        take: limit,
      }),
      prisma!.pharmacyMedicine.count({ where }),
    ]);

    return apiSuccess(
      items.map((item) => ({
        id: item.id,
        medicine: item.medicine,
        price: Number(item.price),
        stock: item.stock,
        // Don't expose exact stock to public - show availability level
        availability:
          item.stock > (item.minimumStock || 10)
            ? "available"
            : item.stock > 0
              ? "limited"
              : "unavailable",
      })),
      {
        status: 200,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    );
  } catch (error) {
    logError("Error fetching pharmacy inventory:", error);
    return apiError("Failed to fetch inventory", "INTERNAL_ERROR", 500);
  }
}
