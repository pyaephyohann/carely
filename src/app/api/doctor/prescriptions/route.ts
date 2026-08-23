import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctor } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { prescriptionSchema } from "@/lib/validation";

// =============================================================================
// POST /api/doctor/prescriptions
// Create a prescription for an existing consultation (doctor must own the consultation)
// =============================================================================

export async function POST(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const validation = prescriptionSchema.safeParse(body);

    if (!validation.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, {
        validation: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
    }

    const { consultationId, diagnosis, notes, validUntil, items } = validation.data;

    const doctor = await prisma!.doctor.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!doctor) {
      return apiError("Doctor profile not found", "NOT_FOUND", 404);
    }

    // Verify consultation exists and doctor owns it
    const consultation = await prisma!.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      return apiError("Consultation not found", "NOT_FOUND", 404);
    }

    if (consultation.doctorId !== doctor.id) {
      return apiError("Access denied", "FORBIDDEN", 403);
    }

    // Validate medicine IDs exist
    const medicineIds = items.map((i) => i.medicineId);
    const validMedicines = await prisma!.medicine.findMany({
      where: { id: { in: medicineIds }, active: true },
      select: { id: true },
    });

    if (validMedicines.length !== medicineIds.length) {
      const foundIds = new Set(validMedicines.map((m) => m.id));
      const invalidIds = medicineIds.filter((id) => !foundIds.has(id));
      return apiError(
        `Invalid or inactive medicine(s): ${invalidIds.join(", ")}`,
        "VALIDATION_ERROR",
        400,
      );
    }

    // Create prescription with items
    const prescription = await prisma!.prescription.create({
      data: {
        consultationId,
        doctorId: doctor.id,
        patientId: consultation.patientId,
        diagnosis,
        notes: notes || null,
        status: "FINALIZED",
        validUntil: validUntil ? new Date(validUntil) : null,
        items: {
          create: items.map((item) => ({
            medicineId: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || null,
          })),
        },
      },
      include: {
        items: {
          include: { medicine: true },
        },
      },
    });

    return apiSuccess(
      {
        id: prescription.id,
        consultationId: prescription.consultationId,
        diagnosis: prescription.diagnosis,
        notes: prescription.notes,
        status: prescription.status,
        validUntil: prescription.validUntil?.toISOString() || null,
        createdAt: prescription.createdAt.toISOString(),
        items: prescription.items.map((item) => ({
          id: item.id,
          medicineId: item.medicineId,
          medicineName: item.medicine.name,
          medicineGenericName: item.medicine.genericName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
        })),
      },
      201,
    );
  } catch (error) {
    console.error("Error creating prescription:", error);
    return apiError("Failed to create prescription", "INTERNAL_ERROR", 500);
  }
}

// =============================================================================
// GET /api/doctor/prescriptions
// List prescriptions for the authenticated doctor
// =============================================================================

export async function GET(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  try {
    const doctor = await prisma!.doctor.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!doctor) {
      return apiError("Doctor profile not found", "NOT_FOUND", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status") || undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { doctorId: doctor.id };
    if (status) where.status = status;

    const [prescriptions, total] = await Promise.all([
      prisma!.prescription.findMany({
        where,
        include: {
          items: {
            include: { medicine: true },
          },
          patient: {
            select: { firstName: true, lastName: true },
          },
          consultation: {
            select: { id: true, diagnosis: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma!.prescription.count({ where }),
    ]);

    return apiSuccess(
      prescriptions.map((rx) => ({
        id: rx.id,
        consultationId: rx.consultationId,
        diagnosis: rx.diagnosis,
        notes: rx.notes,
        status: rx.status,
        validUntil: rx.validUntil?.toISOString() || null,
        createdAt: rx.createdAt.toISOString(),
        patient: {
          firstName: rx.patient.firstName,
          lastName: rx.patient.lastName,
        },
        consultation: {
          id: rx.consultation.id,
          diagnosis: rx.consultation.diagnosis,
        },
        itemCount: rx.items.length,
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
    console.error("Error fetching prescriptions:", error);
    return apiError("Failed to fetch prescriptions", "INTERNAL_ERROR", 500);
  }
}
