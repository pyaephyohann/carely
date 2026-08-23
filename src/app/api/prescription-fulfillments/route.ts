import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { createFulfillmentSchema } from "@/lib/validation";

// =============================================================================
// POST /api/prescription-fulfillments
// Patient submits a finalized prescription for fulfillment at a pharmacy
// =============================================================================

export async function POST(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const validation = createFulfillmentSchema.safeParse(body);

    if (!validation.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, {
        validation: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
    }

    const { prescriptionId, pharmacyId } = validation.data;

    // Derive patient from authenticated user
    const patient = await prisma!.patient.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!patient) {
      return apiError("Patient profile not found", "NOT_FOUND", 404);
    }

    // Verify prescription exists, belongs to patient, and is finalized
    const prescription = await prisma!.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: { include: { medicine: true } },
      },
    });

    if (!prescription) {
      return apiError("Prescription not found", "NOT_FOUND", 404);
    }

    if (prescription.patientId !== patient.id) {
      return apiError("Access denied", "FORBIDDEN", 403);
    }

    if (prescription.status !== "FINALIZED" && prescription.status !== "ACTIVE") {
      return apiError(
        "Only finalized or active prescriptions can be submitted for fulfillment",
        "INVALID_STATUS",
        422,
      );
    }

    // Check if already submitted
    const existingFulfillment = await prisma!.prescriptionFulfillment.findUnique({
      where: { prescriptionId },
    });

    if (existingFulfillment) {
      return apiError(
        "This prescription has already been submitted for fulfillment",
        "ALREADY_EXISTS",
        409,
      );
    }

    // Verify pharmacy exists and is active
    const pharmacy = await prisma!.pharmacy.findFirst({
      where: { id: pharmacyId, active: true, deletedAt: null },
    });

    if (!pharmacy) {
      return apiError("Pharmacy not found or inactive", "NOT_FOUND", 404);
    }

    // Server-side availability check: verify all medicines are available at this pharmacy
    const pharmacyInventory = await prisma!.pharmacyMedicine.findMany({
      where: {
        pharmacyId,
        inStock: true,
        medicineId: { in: prescription.items.map((item) => item.medicineId) },
      },
    });

    const availableMedicineIds = new Set(pharmacyInventory.map((inv) => inv.medicineId));

    // Create fulfillment with items in a transaction
    const result = await prisma!.$transaction(async (tx) => {
      const fulfillment = await tx.prescriptionFulfillment.create({
        data: {
          prescriptionId,
          patientId: patient.id,
          pharmacyId,
          status: "PENDING",
          items: {
            create: prescription.items.map((item) => ({
              pharmacyMedicineId: availableMedicineIds.has(item.medicineId)
                ? pharmacyInventory.find((inv) => inv.medicineId === item.medicineId)?.id || null
                : null,
              medicineName: `${item.medicine.name} ${item.dosage}`,
              dosage: item.dosage,
              quantity: 1,
              fulfilled: false,
            })),
          },
        },
        include: {
          items: true,
          pharmacy: { select: { id: true, name: true } },
        },
      });

      return fulfillment;
    });

    return apiSuccess(
      {
        id: result.id,
        prescriptionId: result.prescriptionId,
        pharmacy: result.pharmacy,
        status: result.status,
        items: result.items.map((item) => ({
          id: item.id,
          medicineName: item.medicineName,
          available: item.pharmacyMedicineId !== null,
        })),
        createdAt: result.createdAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    console.error("Error creating fulfillment:", error);
    return apiError("Failed to submit prescription for fulfillment", "INTERNAL_ERROR", 500);
  }
}

// =============================================================================
// GET /api/prescription-fulfillments
// Patient lists their own fulfillments
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const patient = await prisma!.patient.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!patient) {
      return apiError("Patient profile not found", "NOT_FOUND", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status") || undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { patientId: patient.id };
    if (status) where.status = status;

    const [fulfillments, total] = await Promise.all([
      prisma!.prescriptionFulfillment.findMany({
        where,
        include: {
          pharmacy: { select: { id: true, name: true, address: true } },
          prescription: {
            select: {
              id: true,
              diagnosis: true,
              createdAt: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: "desc" },
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
        pharmacy: f.pharmacy,
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
    console.error("Error fetching fulfillments:", error);
    return apiError("Failed to fetch fulfillments", "INTERNAL_ERROR", 500);
  }
}
