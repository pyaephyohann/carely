import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

// =============================================================================
// GET /api/medicines
// Search the global medicine catalog. Public endpoint for prescription builder.
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { active: true };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { genericName: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    const [medicines, total] = await Promise.all([
      prisma!.medicine.findMany({
        where,
        select: {
          id: true,
          name: true,
          genericName: true,
          category: true,
          manufacturer: true,
          description: true,
          dosageForms: true,
          requiresPrescription: true,
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma!.medicine.count({ where }),
    ]);

    return apiSuccess(
      medicines.map((med) => ({
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        manufacturer: med.manufacturer,
        description: med.description,
        dosageForms: med.dosageForms,
        requiresPrescription: med.requiresPrescription,
      })),
      {
        status: 200,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    );
  } catch (error) {
    logError("Error searching medicines:", error);
    return apiError("Failed to search medicines", "INTERNAL_ERROR", 500);
  }
}
