import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { apiSuccess, apiError, requireDatabase } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pharmacyId: string }> }
) {
  const dbCheck = requireDatabase();
  if (dbCheck) return dbCheck;

  const auth = await requireAdmin(request as never);
  if (!auth.authenticated) return auth.response;

  const { pharmacyId } = await params;

  try {
    const pharmacy = await prisma!.pharmacy.findUnique({
      where: { id: pharmacyId },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            user: { select: { id: true, email: true, status: true } },
          },
        },
        _count: {
          select: { inventories: true, fulfillments: true },
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
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
      openingHours: pharmacy.openingHours as Record<string, unknown> | null,
      verified: pharmacy.verified,
      verifiedAt: pharmacy.verifiedAt?.toISOString() || null,
      active: pharmacy.active,
      createdAt: pharmacy.createdAt.toISOString(),
      updatedAt: pharmacy.updatedAt.toISOString(),
      staff: pharmacy.staff.map((s) => ({
        ...s,
        email: s.user.email,
        userStatus: s.user.status,
      })),
      counts: {
        staff: pharmacy.staff.length,
        medicines: pharmacy._count.inventories,
        fulfillments: pharmacy._count.fulfillments,
      },
    });
  } catch (error) {
    console.error("Admin pharmacy detail error:", error);
    return apiError("Failed to load pharmacy", "PHARMACY_ERROR", 500);
  }
}
