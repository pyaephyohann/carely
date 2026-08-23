import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";

// =============================================================================
// GET /api/pharmacies
// Public endpoint for pharmacy discovery
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const verified = searchParams.get("verified") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { active: true, deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (verified === "true") where.verified = true;

    const [pharmacies, total] = await Promise.all([
      prisma!.pharmacy.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          phone: true,
          email: true,
          logo: true,
          verified: true,
          openingHours: true,
          _count: {
            select: { inventories: { where: { inStock: true } } },
          },
        },
        orderBy: [{ verified: "desc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma!.pharmacy.count({ where }),
    ]);

    return apiSuccess(
      pharmacies.map((ph) => ({
        id: ph.id,
        name: ph.name,
        description: ph.description,
        address: ph.address,
        phone: ph.phone,
        email: ph.email,
        logo: ph.logo,
        verified: ph.verified,
        openingHours: ph.openingHours,
        medicineCount: ph._count.inventories,
      })),
      {
        status: 200,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    );
  } catch (error) {
    logError("Error fetching pharmacies:", error);
    return apiError("Failed to fetch pharmacies", "INTERNAL_ERROR", 500);
  }
}
