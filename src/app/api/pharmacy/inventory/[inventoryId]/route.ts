import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { inventoryUpdateSchema, stockAdjustmentSchema } from "@/lib/validation";

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
// PATCH /api/pharmacy/inventory/[inventoryId]
// Update inventory item (price, minimumStock, inStock) or adjust stock
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ inventoryId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requirePharmacy(request);
  if (!auth.authenticated) return auth.response;

  try {
    const pharmacyId = await getPharmacyForUser(auth.user.userId);
    if (!pharmacyId) {
      return apiError("No pharmacy associated with your account", "NOT_FOUND", 404);
    }

    const { inventoryId } = await params;

    // Verify ownership
    const existing = await prisma!.pharmacyMedicine.findFirst({
      where: { id: inventoryId, pharmacyId },
      include: { medicine: { select: { name: true } } },
    });

    if (!existing) {
      return apiError("Inventory item not found", "NOT_FOUND", 404);
    }

    const body = await request.json();

    // Check if this is a stock adjustment
    if (body.type && body.quantity !== undefined) {
      const adjValidation = stockAdjustmentSchema.safeParse(body);
      if (!adjValidation.success) {
        return apiError("Validation failed", "VALIDATION_ERROR", 400, {
          validation: adjValidation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        });
      }

      const { quantity, type, reason } = adjValidation.data;

      // Calculate new stock
      let newStock: number;
      if (type === "PURCHASE" || type === "RETURN") {
        newStock = existing.stock + quantity;
      } else if (type === "ADJUSTMENT") {
        // For adjustments, quantity is the absolute new stock value
        newStock = quantity;
      } else {
        newStock = existing.stock - quantity;
      }

      if (newStock < 0) {
        return apiError(
          `Insufficient stock. Current: ${existing.stock}, requested: ${quantity}`,
          "INSUFFICIENT_STOCK",
          409,
        );
      }

      // Transaction: update stock + record transaction
      const result = await prisma!.$transaction(async (tx) => {
        const updated = await tx.pharmacyMedicine.update({
          where: { id: inventoryId },
          data: {
            stock: newStock,
            inStock: newStock > 0,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            pharmacyMedicineId: inventoryId,
            type,
            quantity: type === "ADJUSTMENT" ? newStock - existing.stock : quantity,
            previousStock: existing.stock,
            newStock,
            reason: reason || `${type}: ${existing.medicine.name}`,
            performedBy: auth.user.userId,
          },
        });

        return updated;
      });

      return apiSuccess({
        id: result.id,
        stock: result.stock,
        price: Number(result.price),
        minimumStock: result.minimumStock,
        inStock: result.inStock,
        transaction: {
          type,
          previousStock: existing.stock,
          newStock: result.stock,
        },
      });
    }

    // Regular field updates
    const fieldValidation = inventoryUpdateSchema.safeParse(body);
    if (!fieldValidation.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, {
        validation: fieldValidation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
    }

    const { stock, price, minimumStock, inStock } = fieldValidation.data;

    const updated = await prisma!.pharmacyMedicine.update({
      where: { id: inventoryId },
      data: {
        ...(stock !== undefined && { stock, inStock: stock > 0 }),
        ...(price !== undefined && { price }),
        ...(minimumStock !== undefined && { minimumStock }),
        ...(inStock !== undefined && { inStock }),
      },
    });

    return apiSuccess({
      id: updated.id,
      stock: updated.stock,
      price: Number(updated.price),
      minimumStock: updated.minimumStock,
      inStock: updated.inStock,
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    return apiError("Failed to update inventory", "INTERNAL_ERROR", 500);
  }
}

// =============================================================================
// DELETE /api/pharmacy/inventory/[inventoryId]
// Remove medicine from inventory (soft deactivation)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inventoryId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requirePharmacy(request);
  if (!auth.authenticated) return auth.response;

  try {
    const pharmacyId = await getPharmacyForUser(auth.user.userId);
    if (!pharmacyId) {
      return apiError("No pharmacy associated with your account", "NOT_FOUND", 404);
    }

    const { inventoryId } = await params;

    const existing = await prisma!.pharmacyMedicine.findFirst({
      where: { id: inventoryId, pharmacyId },
    });

    if (!existing) {
      return apiError("Inventory item not found", "NOT_FOUND", 404);
    }

    // Check if there are active fulfillments referencing this item
    const activeFulfillments = await prisma!.prescriptionFulfillmentItem.count({
      where: {
        pharmacyMedicineId: inventoryId,
        fulfillment: { status: { in: ["PENDING", "ACCEPTED", "PREPARING"] } },
      },
    });

    if (activeFulfillments > 0) {
      return apiError(
        "Cannot remove item with active fulfillment requests. Complete or cancel them first.",
        "ACTIVE_FULFILLMENTS",
        409,
      );
    }

    // Soft deactivation: set inStock to false and stock to 0
    await prisma!.pharmacyMedicine.update({
      where: { id: inventoryId },
      data: { inStock: false, stock: 0 },
    });

    // Record removal as transaction
    if (existing.stock > 0) {
      await prisma!.inventoryTransaction.create({
        data: {
          pharmacyMedicineId: inventoryId,
          type: "ADJUSTMENT",
          quantity: -existing.stock,
          previousStock: existing.stock,
          newStock: 0,
          reason: "Removed from inventory",
          performedBy: auth.user.userId,
        },
      });
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("Error deleting inventory:", error);
    return apiError("Failed to remove inventory item", "INTERNAL_ERROR", 500);
  }
}
