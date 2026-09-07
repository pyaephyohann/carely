import type { Prisma } from "@prisma/client";

/** Appointment statuses that allow prescription / consultation clinical work */
export const CLINICAL_APPOINTMENT_STATUSES = ["CONFIRMED", "COMPLETED"] as const;

export type ClinicalAppointmentStatus = (typeof CLINICAL_APPOINTMENT_STATUSES)[number];

export function isClinicalAppointmentStatus(status: string): status is ClinicalAppointmentStatus {
  return CLINICAL_APPOINTMENT_STATUSES.includes(status as ClinicalAppointmentStatus);
}

type DbClient = Prisma.TransactionClient | NonNullable<typeof import("@/lib/prisma").prisma>;

/**
 * Returns the consultation for an appointment, creating a minimal record if needed.
 * Patient/doctor IDs always come from the appointment — never from the client.
 */
export async function ensureConsultationForAppointment(
  db: DbClient,
  params: {
    appointmentId: string;
    doctorId: string;
    diagnosis: string;
  },
) {
  const appointment = await db.appointment.findFirst({
    where: {
      id: params.appointmentId,
      doctorId: params.doctorId,
    },
    include: { consultation: true },
  });

  if (!appointment) {
    return { error: "NOT_FOUND" as const };
  }

  if (!isClinicalAppointmentStatus(appointment.status)) {
    return { error: "INVALID_STATUS" as const, status: appointment.status };
  }

  if (appointment.consultation) {
    return { consultation: appointment.consultation, appointment };
  }

  const consultation = await db.consultation.create({
    data: {
      appointmentId: appointment.id,
      doctorId: params.doctorId,
      patientId: appointment.patientId,
      diagnosis: params.diagnosis,
    },
  });

  return { consultation, appointment };
}
