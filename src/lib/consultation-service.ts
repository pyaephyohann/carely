import type { Prisma } from "@prisma/client";
import { isClinicalAppointmentStatus } from "@/lib/prescription-service";
import { isValidTransition } from "@/lib/appointment-utils";

export type ConsultationCreateDenial = {
  code: "FORBIDDEN" | "ALREADY_EXISTS" | "INVALID_STATUS";
  httpStatus: 403 | 409 | 422;
};

/**
 * Shared create-consultation guards. Duplicate check runs before status so
 * 409 ALREADY_EXISTS is returned even when the appointment is no longer CONFIRMED.
 */
export function getConsultationCreateDenial(params: {
  isOwner: boolean;
  hasExistingConsultation: boolean;
  appointmentStatus: string;
}): ConsultationCreateDenial | null {
  if (!params.isOwner) {
    return { code: "FORBIDDEN", httpStatus: 403 };
  }

  if (params.hasExistingConsultation) {
    return { code: "ALREADY_EXISTS", httpStatus: 409 };
  }

  if (!isClinicalAppointmentStatus(params.appointmentStatus)) {
    return { code: "INVALID_STATUS", httpStatus: 422 };
  }

  return null;
}

/** Creating a consultation from a CONFIRMED visit completes the appointment. */
export function shouldCompleteAppointmentOnConsultationCreate(status: string): boolean {
  return status === "CONFIRMED" && isValidTransition(status, "COMPLETED");
}

/**
 * List filter for the authenticated doctor's consultations.
 * Search is optional; doctorId always comes from the session, never the client.
 */
export function buildDoctorConsultationListWhere(
  doctorId: string,
  search?: string,
): Prisma.ConsultationWhereInput {
  const q = search?.trim();
  if (!q) {
    return { doctorId };
  }

  return {
    doctorId,
    AND: [
      {
        OR: [
          { diagnosis: { contains: q, mode: "insensitive" } },
          { symptoms: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
          { appointment: { reason: { contains: q, mode: "insensitive" } } },
          { patient: { firstName: { contains: q, mode: "insensitive" } } },
          { patient: { lastName: { contains: q, mode: "insensitive" } } },
        ],
      },
    ],
  };
}

export function getRtkErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) return undefined;
  const data = (error as { data?: { error?: { code?: string } } }).data;
  return data?.error?.code;
}

export function getRtkErrorMessage(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) return undefined;
  const data = (error as { data?: { error?: { message?: string } } }).data;
  return data?.error?.message;
}
