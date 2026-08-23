/**
 * Centralized notification type definitions.
 * Each business event maps to one or more notification actions.
 */

export type AppNotificationType =
  | "APPOINTMENT_BOOKED"
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_REMINDER"
  | "PRESCRIPTION_CREATED"
  | "PRESCRIPTION_FINALIZED"
  | "PHARMACY_FULFILLMENT_RECEIVED"
  | "PHARMACY_FULFILLMENT_ACCEPTED"
  | "PHARMACY_FULFILLMENT_REJECTED"
  | "PHARMACY_FULFILLMENT_READY"
  | "PHARMACY_FULFILLMENT_COMPLETED"
  | "DOCTOR_VERIFIED"
  | "SYSTEM";

// =============================================================================
// Event Payloads
// =============================================================================

export interface AppointmentBookedPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patientUserId: string;
  doctorUserId: string;
  doctorName: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
}

export interface AppointmentConfirmedPayload {
  appointmentId: string;
  patientUserId: string;
  doctorName: string;
  date: string;
  time: string;
}

export interface AppointmentCancelledPayload {
  appointmentId: string;
  recipientUserId: string;
  cancelledByName: string;
  date: string;
  time: string;
  reason?: string;
}

export interface PrescriptionFinalizedPayload {
  prescriptionId: string;
  patientUserId: string;
  doctorName: string;
  diagnosis: string;
  itemCount: number;
}

export interface PharmacyFulfillmentPayload {
  fulfillmentId: string;
  patientUserId: string;
  pharmacyStaffUserId?: string;
  pharmacyName: string;
  status: string;
  prescriptionDiagnosis: string;
  rejectReason?: string;
}

// =============================================================================
// Notification creation input
// =============================================================================

export interface CreateNotificationInput {
  userId: string;
  type: AppNotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}
