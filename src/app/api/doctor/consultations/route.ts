import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireDoctor } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { consultationCreateSchema, prescriptionSchema } from "@/lib/validation";
import { onPrescriptionFinalized } from "@/lib/notifications/events";
import { isClinicalAppointmentStatus } from "@/lib/prescription-service";

// =============================================================================
// POST /api/doctor/consultations
// Save visit/consultation notes. Prescription optional. Completion optional.
// Does NOT require a prescription. Does NOT auto-complete unless requested.
// =============================================================================

export async function POST(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return apiError("Invalid request body", "INVALID_BODY", 400);
    }

    const validation = consultationCreateSchema.safeParse(body);

    if (!validation.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, {
        validation: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
    }

    const {
      appointmentId,
      diagnosis,
      symptoms,
      notes,
      followUpDate,
      completeAppointment = false,
    } = validation.data;

    const appointment = await prisma!.appointment.findUnique({
      where: { id: appointmentId },
      include: { consultation: true },
    });

    if (!appointment) {
      return apiError("Appointment not found", "NOT_FOUND", 404);
    }

    const doctor = await prisma!.doctor.findFirst({
      where: { userId: auth.user.userId },
    });

    if (!doctor || appointment.doctorId !== doctor.id) {
      return apiError("You can only create consultations for your own appointments", "FORBIDDEN", 403);
    }

    if (appointment.consultation) {
      return apiError(
        "A consultation already exists for this appointment",
        "ALREADY_EXISTS",
        409,
      );
    }

    if (!isClinicalAppointmentStatus(appointment.status)) {
      return apiError(
        "Consultations can only be created for confirmed or completed appointments",
        "INVALID_STATUS",
        422,
      );
    }

    let prescriptionData: {
      diagnosis: string;
      notes?: string;
      validUntil?: Date;
      items: {
        medicineId: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
      }[];
    } | null = null;

    if (body.prescription && typeof body.prescription === "object") {
      const rxValidation = prescriptionSchema.safeParse({
        consultationId: "placeholder",
        ...(body.prescription as Record<string, unknown>),
      });
      if (!rxValidation.success) {
        return apiError("Prescription validation failed", "VALIDATION_ERROR", 400, {
          validation: rxValidation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        });
      }

      const { items, ...rxFields } = rxValidation.data;
      prescriptionData = {
        ...rxFields,
        validUntil: rxFields.validUntil ? new Date(rxFields.validUntil) : undefined,
        items: items.map((item) => ({
          medicineId: item.medicineId,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
        })),
      };

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
    }

    const result = await prisma!.$transaction(async (tx) => {
      const consultation = await tx.consultation.create({
        data: {
          appointmentId,
          doctorId: doctor.id,
          patientId: appointment.patientId,
          diagnosis,
          symptoms: symptoms || null,
          notes: notes || null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        },
      });

      let prescription = null;
      if (prescriptionData) {
        prescription = await tx.prescription.create({
          data: {
            consultationId: consultation.id,
            doctorId: doctor.id,
            patientId: appointment.patientId,
            diagnosis: prescriptionData.diagnosis,
            notes: prescriptionData.notes || null,
            status: "FINALIZED",
            validUntil: prescriptionData.validUntil,
            items: { create: prescriptionData.items },
          },
          include: {
            items: { include: { medicine: true } },
          },
        });
      }

      if (completeAppointment && appointment.status === "CONFIRMED") {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: "COMPLETED" },
        });
      }

      await tx.medicalRecord.create({
        data: {
          patientId: appointment.patientId,
          doctorId: doctor.id,
          consultationId: consultation.id,
          type: "VISIT_NOTE",
          title: `Consultation - ${diagnosis}`,
          description: symptoms || notes || null,
          treatmentPlan: notes || null,
        },
      });

      return { consultation, prescription };
    });

    if (result.prescription) {
      const doctorData = await prisma!.doctor.findUnique({
        where: { id: doctor.id },
        select: { firstName: true, lastName: true },
      });
      const patientUser = await prisma!.patient.findUnique({
        where: { id: appointment.patientId },
        select: { userId: true },
      });
      if (doctorData && patientUser) {
        onPrescriptionFinalized({
          prescriptionId: result.prescription.id,
          patientUserId: patientUser.userId,
          doctorName: `${doctorData.firstName} ${doctorData.lastName}`,
          diagnosis: result.prescription.diagnosis,
          itemCount: result.prescription.items.length,
        }).catch(() => {});
      }
    }

    return apiSuccess(
      {
        consultation: {
          id: result.consultation.id,
          appointmentId: result.consultation.appointmentId,
          diagnosis: result.consultation.diagnosis,
          symptoms: result.consultation.symptoms,
          notes: result.consultation.notes,
          followUpDate: result.consultation.followUpDate?.toISOString() || null,
          createdAt: result.consultation.createdAt.toISOString(),
        },
        prescription: result.prescription
          ? {
              id: result.prescription.id,
              consultationId: result.prescription.consultationId,
              diagnosis: result.prescription.diagnosis,
              notes: result.prescription.notes,
              status: result.prescription.status,
              validUntil: result.prescription.validUntil?.toISOString() || null,
              createdAt: result.prescription.createdAt.toISOString(),
              items: result.prescription.items.map((item) => ({
                id: item.id,
                medicineId: item.medicineId,
                medicineName: item.medicine.name,
                medicineGenericName: item.medicine.genericName,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions,
              })),
            }
          : null,
      },
      201,
    );
  } catch (error) {
    logError("Error creating consultation:", error);
    return apiError("Failed to create consultation", "INTERNAL_ERROR", 500);
  }
}
