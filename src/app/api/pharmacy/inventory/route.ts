import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { inventoryItemSchema } from "@/lib/validation";

// =============================================================================
// Helper: Get the pharmacy for the authenticated pharmacy staff user
// =============================================================================

async function getPharmacyForUser(userId: string) {
  const staff = await prisma!.pharmacyStaff.findUnique({
    where: { userId },
    select: { pharmacyId: true },
  });
  return staff?.pharmacyId || null;
}

// =============================================================================
// GET /api/pharmacy/inventory
// List inventory for the authenticated pharmacy
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
    const search = searchParams.get("search") || "";
    const lowStock = searchParams.get("lowStock") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { pharmacyId };

    if (search) {
      where.medicine = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { genericName: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (lowStock) {
      where.stock = { lte: prisma!.pharmacyMedicine.fields.minimumStock };
      // Prisma doesn't support field references, use raw comparison
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
              manufacturer: true,
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

    // Separate lowStock filtering since Prisma can't reference fields
    let filteredItems = items;
    if (lowStock) {
      filteredItems = items.filter((item) => item.stock <= item.minimumStock);
    }

    return apiSuccess(
      filteredItems.map((item) => ({
        id: item.id,
        medicine: item.medicine,
        stock: item.stock,
        price: Number(item.price),
        minimumStock: item.minimumStock,
        inStock: item.inStock,
        isLowStock: item.stock <= item.minimumStock,
      })),
      {
        status: 200,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    );
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return apiError("Failed to fetch inventory", "INTERNAL_ERROR", 500);
  }
}

// =============================================================================
// POST /api/pharmacy/inventory
// Add a medicine to pharmacy inventory
// =============================================================================

export async function POST(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requirePharmacy(request);
  if (!auth.authenticated) return auth.response;

  try {
    const pharmacyId = await getPharmacyForUser(auth.user.userId);
    if (!pharmacyId) {
      return apiError("No pharmacy associated with your account", "NOT_FOUND", 404);
    }

    const body = await request.json();
    const validation = inventoryItemSchema.safeParse(body);

    if (!validation.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, {
        validation: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
    }

    const { medicineId, stock, price, minimumStock } = validation.data;

    // Verify medicine exists and is active
    const medicine = await prisma!.medicine.findFirst({
      where: { id: medicineId, active: true },
    });

    if (!medicine) {
      return apiError("Medicine not found or inactive", "NOT_FOUND", 404);
    }

    // Check if already in inventory
    const existing = await prisma!.pharmacyMedicine.findUnique({
      where: { pharmacyId_medicineId: { pharmacyId, medicineId } },
    });

    if (existing) {
      return apiError("This medicine is already in your inventory. Use PATCH to update.", "ALREADY_EXISTS", 409);
    }

    // Create inventory item with transaction for audit trail
    const result = await prisma!.$transaction(async (tx) => {
      const item = await tx.pharmacyMedicine.create({
        data: {
          pharmacyId,
          medicineId,
          stock,
          price,
          minimumStock: minimumStock || 0,
          inStock: stock > 0,
        },
        include: {
          medicine: {
            select: { id: true, name: true, genericName: true, category: true },
          },
        },
      });

      // Record initial stock as transaction
      if (stock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            pharmacyMedicineId: item.id,
            type: "PURCHASE",
            quantity: stock,
            previousStock: 0,
            newStock: stock,
            reason: "Initial inventory",
            performedBy: auth.user.userId,
          },
        });
      }

      return item;
    });

    return apiSuccess(
      {
        id: result.id,
        medicine: result.medicine,
        stock: result.stock,
        price: Number(result.price),
        minimumStock: result.minimumStock,
        inStock: result.inStock,
      },
      201,
    );
  } catch (error) {
    console.error("Error adding inventory:", error);
    return apiError("Failed to add inventory item", "INTERNAL_ERROR", 500);
  }
}
