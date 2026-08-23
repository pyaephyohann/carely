import { NextRequest } from "next/server";
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
// GET /api/pharmacy/prescriptions/[prescriptionId]
// View a specific fulfillment detail (pharmacy staff only, must belong to their pharmacy)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prescriptionId: string }> },
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

    const { prescriptionId } = await params;

    // The prescriptionId param is actually the fulfillment ID
    const fulfillment = await prisma!.prescriptionFulfillment.findFirst({
      where: { id: prescriptionId, pharmacyId },
      include: {
        patient: {
          include: { user: { select: { email: true } } },
        },
        prescription: {
          include: {
            items: {
              include: {
                medicine: {
                  select: {
                    id: true,
                    name: true,
                    genericName: true,
                    category: true,
                    dosageForms: true,
                  },
                },
              },
            },
            doctor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        items: true,
      },
    });

    if (!fulfillment) {
      return apiError("Fulfillment request not found", "NOT_FOUND", 404);
    }

    // Check medicine availability for each prescription item
    const medicineIds = fulfillment.prescription.items.map((item: { medicineId: string }) => item.medicineId);
    const inventory = await prisma!.pharmacyMedicine.findMany({
      where: { pharmacyId, medicineId: { in: medicineIds } },
      select: {
        medicineId: true,
        stock: true,
        price: true,
        inStock: true,
      },
    });

    const inventoryMap = new Map(inventory.map((inv) => [inv.medicineId, inv]));

    return apiSuccess({
      id: fulfillment.id,
      status: fulfillment.status,
      rejectReason: fulfillment.rejectReason,
      patient: {
        id: fulfillment.patient.id,
        name: `${fulfillment.patient.firstName} ${fulfillment.patient.lastName}`,
        phone: fulfillment.patient.phone,
        email: fulfillment.patient.user?.email || null,
      },
      prescription: {
        id: fulfillment.prescription.id,
        diagnosis: fulfillment.prescription.diagnosis,
        notes: fulfillment.prescription.notes,
        status: fulfillment.prescription.status,
        validUntil: fulfillment.prescription.validUntil?.toISOString() || null,
        createdAt: fulfillment.prescription.createdAt.toISOString(),
        doctor: fulfillment.prescription.doctor,
        items: fulfillment.prescription.items.map((item: { id: string; medicineId: string; medicine: { name: string; genericName: string | null; category: string; dosageForms: string[] }; dosage: string; frequency: string; duration: string; instructions: string | null }) => {
          const inv = inventoryMap.get(item.medicineId);
          return {
            id: item.id,
            medicineId: item.medicineId,
            medicineName: item.medicine.name,
            medicineGenericName: item.medicine.genericName,
            medicineCategory: item.medicine.category,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
            inStock: inv?.inStock ?? false,
            stock: inv?.stock ?? 0,
            price: inv ? Number(inv.price) : null,
          };
        }),
      },
      items: fulfillment.items.map((item: { id: string; medicineName: string; dosage: string; quantity: number; fulfilled: boolean; pharmacyMedicineId: string | null }) => ({
        id: item.id,
        medicineName: item.medicineName,
        dosage: item.dosage,
        quantity: item.quantity,
        fulfilled: item.fulfilled,
        pharmacyMedicineId: item.pharmacyMedicineId,
      })),
      createdAt: fulfillment.createdAt.toISOString(),
      updatedAt: fulfillment.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching fulfillment detail:", error);
    return apiError("Failed to fetch fulfillment detail", "INTERNAL_ERROR", 500);
  }
}
