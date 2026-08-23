import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctor } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { consultationUpdateSchema } from "@/lib/validation";

// =============================================================================
// GET /api/doctor/consultations/[consultationId]
// View a consultation record (doctor must own it)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { consultationId } = await params;

    const doctor = await prisma!.doctor.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!doctor) {
      return apiError("Doctor profile not found", "NOT_FOUND", 404);
    }

    const consultation = await prisma!.consultation.findUnique({
      where: { id: consultationId },
      include: {
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            type: true,
            status: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        prescriptions: {
          include: {
            items: {
              include: { medicine: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        medicalRecords: true,
      },
    });

    if (!consultation) {
      return apiError("Consultation not found", "NOT_FOUND", 404);
    }

    // Authorization: doctor must own the consultation
    if (consultation.doctorId !== doctor.id) {
      return apiError("Access denied", "FORBIDDEN", 403);
    }

    return apiSuccess({
      id: consultation.id,
      appointmentId: consultation.appointmentId,
      diagnosis: consultation.diagnosis,
      symptoms: consultation.symptoms,
      notes: consultation.notes,
      followUpDate: consultation.followUpDate?.toISOString() || null,
      createdAt: consultation.createdAt.toISOString(),
      updatedAt: consultation.updatedAt.toISOString(),
      appointment: {
        id: consultation.appointment.id,
        startTime: consultation.appointment.startTime.toISOString(),
        endTime: consultation.appointment.endTime.toISOString(),
        type: consultation.appointment.type,
        status: consultation.appointment.status,
      },
      patient: {
        id: consultation.patient.id,
        firstName: consultation.patient.firstName,
        lastName: consultation.patient.lastName,
        phone: consultation.patient.phone,
        avatar: consultation.patient.avatar,
      },
      prescriptions: consultation.prescriptions.map((rx) => ({
        id: rx.id,
        diagnosis: rx.diagnosis,
        notes: rx.notes,
        status: rx.status,
        validUntil: rx.validUntil?.toISOString() || null,
        createdAt: rx.createdAt.toISOString(),
        items: rx.items.map((item) => ({
          id: item.id,
          medicineId: item.medicineId,
          medicineName: item.medicine.name,
          medicineGenericName: item.medicine.genericName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
        })),
      })),
    });
  } catch (error) {
    console.error("Error fetching consultation:", error);
    return apiError("Failed to fetch consultation", "INTERNAL_ERROR", 500);
  }
}

// =============================================================================
// PATCH /api/doctor/consultations/[consultationId]
// Update a consultation record (doctor must own it)
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { consultationId } = await params;
    const body = await request.json();
    const validation = consultationUpdateSchema.safeParse(body);

    if (!validation.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, {
        validation: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
    }

    const doctor = await prisma!.doctor.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!doctor) {
      return apiError("Doctor profile not found", "NOT_FOUND", 404);
    }

    const consultation = await prisma!.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      return apiError("Consultation not found", "NOT_FOUND", 404);
    }

    if (consultation.doctorId !== doctor.id) {
      return apiError("Access denied", "FORBIDDEN", 403);
    }

    const { diagnosis, symptoms, notes, followUpDate } = validation.data;

    const updated = await prisma!.consultation.update({
      where: { id: consultationId },
      data: {
        ...(diagnosis !== undefined && { diagnosis }),
        ...(symptoms !== undefined && { symptoms: symptoms || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(followUpDate !== undefined && {
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        }),
      },
    });

    return apiSuccess({
      id: updated.id,
      diagnosis: updated.diagnosis,
      symptoms: updated.symptoms,
      notes: updated.notes,
      followUpDate: updated.followUpDate?.toISOString() || null,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating consultation:", error);
    return apiError("Failed to update consultation", "INTERNAL_ERROR", 500);
  }
}
