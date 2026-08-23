
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { apiSuccess, apiError, requireDatabase } from "@/lib/api";

export async function GET(request: Request) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireAdmin(request as never);
  if (!auth.authenticated) return auth.response;

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const search = url.searchParams.get("search") || "";
    const verified = url.searchParams.get("verified");

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { licenseNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (verified !== null && verified !== undefined && verified !== "") {
      where.verified = verified === "true";
    }

    const [total, pharmacies] = await Promise.all([
      prisma!.pharmacy.count({ where }),
      prisma!.pharmacy.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { staff: true, inventories: true, fulfillments: true },
          },
        },
      }),
    ]);

    return apiSuccess(
      pharmacies.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        address: p.address,
        phone: p.phone,
        email: p.email,
        logo: p.logo,
        licenseNumber: p.licenseNumber,
        verified: p.verified,
        verifiedAt: p.verifiedAt?.toISOString() || null,
        active: p.active,
        openingHours: p.openingHours,
        createdAt: p.createdAt.toISOString(),
        counts: {
          staff: p._count.staff,
          medicines: p._count.inventories,
          fulfillments: p._count.fulfillments,
        },
      })),
      {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    console.error("Admin pharmacies error:", error);
    return apiError("Failed to load pharmacies", "PHARMACIES_ERROR", 500);
  }
}
