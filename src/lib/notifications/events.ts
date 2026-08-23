/**
 * Notification event handlers.
 *
 * Each function handles a specific business event and dispatches
 * appropriate in-app notifications and emails.
 *
 * These are called from API routes AFTER the core business operation succeeds.
 * Notification failure never rolls back the business operation.
 */

import { notifyAndEmail } from "./notification-service";
import type {
  AppointmentBookedPayload,
  AppointmentConfirmedPayload,
  AppointmentCancelledPayload,
  PrescriptionFinalizedPayload,
  PharmacyFulfillmentPayload,
} from "./notification-types";
import {
  appointmentBookedEmail,
  appointmentConfirmedEmail,
  appointmentCancelledEmail,
  prescriptionFinalizedEmail,
  pharmacyFulfillmentReceivedEmail,
  pharmacyFulfillmentAcceptedEmail,
  pharmacyFulfillmentRejectedEmail,
  pharmacyFulfillmentReadyEmail,
  pharmacyFulfillmentCompletedEmail,
} from "./templates";

import { prisma } from "@/lib/prisma";

// =============================================================================
// Helper: Get user email
// =============================================================================

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    if (!prisma) return null;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    return user?.email || null;
  } catch {
    return null;
  }
}

// =============================================================================
// Helper: Check if user has notification type enabled
// =============================================================================

async function hasNotificationEnabled(userId: string, field: string): Promise<boolean> {
  try {
    if (!prisma) return true;
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
    if (!prefs) return true; // default: enabled
    return Boolean((prefs as unknown as Record<string, boolean>)[field] ?? true);
  } catch {
    return true;
  }
}

// =============================================================================
// Appointment Events
// =============================================================================

export async function onAppointmentBooked(payload: AppointmentBookedPayload): Promise<void> {
  const dateStr = payload.date;
  const timeStr = payload.time;

  // Notify patient
  notifyAndEmail(
    {
      userId: payload.patientUserId,
      type: "APPOINTMENT_BOOKED",
      title: "Appointment Booked",
      message: `Your appointment with Dr. ${payload.doctorName} has been booked for ${dateStr} at ${timeStr}.`,
      link: `/patient/appointments`,
      metadata: { appointmentId: payload.appointmentId },
    },
    (await hasNotificationEnabled(payload.patientUserId, "appointmentUpdates"))
      ? {
          to: (await getUserEmail(payload.patientUserId)) || "",
          subject: "Appointment Booked - Carely",
          html: appointmentBookedEmail({
            patientName: payload.patientName,
            doctorName: payload.doctorName,
            date: dateStr,
            time: timeStr,
            type: payload.type,
          }),
          type: "APPOINTMENT_BOOKED",
        }
      : undefined,
  );

  // Notify doctor
  notifyAndEmail(
    {
      userId: payload.doctorUserId,
      type: "APPOINTMENT_BOOKED",
      title: "New Appointment",
      message: `${payload.patientName} has booked an appointment for ${dateStr} at ${timeStr}.`,
      link: `/doctor/appointments`,
      metadata: { appointmentId: payload.appointmentId },
    },
    (await hasNotificationEnabled(payload.doctorUserId, "appointmentUpdates"))
      ? {
          to: (await getUserEmail(payload.doctorUserId)) || "",
          subject: "New Appointment Booked - Carely",
          html: appointmentBookedEmail({
            patientName: payload.patientName,
            doctorName: payload.doctorName,
            date: dateStr,
            time: timeStr,
            type: payload.type,
          }).replace("Your appointment has been successfully booked.", `A patient has booked an appointment with you.`),
          type: "APPOINTMENT_BOOKED",
        }
      : undefined,
  );
}

export async function onAppointmentConfirmed(payload: AppointmentConfirmedPayload): Promise<void> {
  notifyAndEmail(
    {
      userId: payload.patientUserId,
      type: "APPOINTMENT_CONFIRMED",
      title: "Appointment Confirmed",
      message: `Dr. ${payload.doctorName} has confirmed your appointment for ${payload.date} at ${payload.time}.`,
      link: `/patient/appointments`,
      metadata: { appointmentId: payload.appointmentId },
    },
    (await hasNotificationEnabled(payload.patientUserId, "appointmentUpdates"))
      ? {
          to: (await getUserEmail(payload.patientUserId)) || "",
          subject: "Appointment Confirmed - Carely",
          html: appointmentConfirmedEmail({
            patientName: "",
            doctorName: payload.doctorName,
            date: payload.date,
            time: payload.time,
          }),
          type: "APPOINTMENT_CONFIRMED",
        }
      : undefined,
  );
}

export async function onAppointmentCancelled(payload: AppointmentCancelledPayload): Promise<void> {
  notifyAndEmail(
    {
      userId: payload.recipientUserId,
      type: "APPOINTMENT_CANCELLED",
      title: "Appointment Cancelled",
      message: `An appointment on ${payload.date} at ${payload.time} has been cancelled by ${payload.cancelledByName}.${payload.reason ? ` Reason: ${payload.reason}` : ""}`,
      link: `/patient/appointments`,
      metadata: { appointmentId: payload.appointmentId },
    },
    (await hasNotificationEnabled(payload.recipientUserId, "appointmentUpdates"))
      ? {
          to: (await getUserEmail(payload.recipientUserId)) || "",
          subject: "Appointment Cancelled - Carely",
          html: appointmentCancelledEmail({
            recipientName: "",
            cancelledByName: payload.cancelledByName,
            date: payload.date,
            time: payload.time,
            reason: payload.reason,
          }),
          type: "APPOINTMENT_CANCELLED",
        }
      : undefined,
  );
}

// =============================================================================
// Prescription Events
// =============================================================================

export async function onPrescriptionFinalized(payload: PrescriptionFinalizedPayload): Promise<void> {
  notifyAndEmail(
    {
      userId: payload.patientUserId,
      type: "PRESCRIPTION_FINALIZED",
      title: "New Prescription",
      message: `Dr. ${payload.doctorName} has finalized a prescription (${payload.diagnosis}). ${payload.itemCount} medication${payload.itemCount !== 1 ? "s" : ""} prescribed.`,
      link: `/patient/prescriptions`,
      metadata: { prescriptionId: payload.prescriptionId },
    },
    (await hasNotificationEnabled(payload.patientUserId, "prescriptionUpdates"))
      ? {
          to: (await getUserEmail(payload.patientUserId)) || "",
          subject: "New Prescription - Carely",
          html: prescriptionFinalizedEmail({
            patientName: "",
            doctorName: payload.doctorName,
            diagnosis: payload.diagnosis,
            itemCount: payload.itemCount,
          }),
          type: "PRESCRIPTION_FINALIZED",
        }
      : undefined,
  );
}

// =============================================================================
// Pharmacy Fulfillment Events
// =============================================================================

export async function onPharmacyFulfillmentStatusChanged(payload: PharmacyFulfillmentPayload): Promise<void> {
  const statusConfig: Record<string, { title: string; message: string }> = {
    PENDING: {
      title: "Prescription Submitted",
      message: `Your prescription has been submitted to ${payload.pharmacyName}.`,
    },
    ACCEPTED: {
      title: "Prescription Accepted",
      message: `${payload.pharmacyName} has accepted your prescription and is preparing your medications.`,
    },
    REJECTED: {
      title: "Prescription Rejected",
      message: `${payload.pharmacyName} was unable to fulfill your prescription.${payload.rejectReason ? ` Reason: ${payload.rejectReason}` : ""}`,
    },
    READY: {
      title: "Prescription Ready",
      message: `Your medications at ${payload.pharmacyName} are ready for pickup.`,
    },
    COMPLETED: {
      title: "Prescription Completed",
      message: `Your prescription has been completed by ${payload.pharmacyName}.`,
    },
  };

  const config = statusConfig[payload.status];
  if (!config) return;

  // Build email HTML based on status
  let emailHtml = "";
  if (payload.status === "REJECTED") {
    emailHtml = pharmacyFulfillmentRejectedEmail({
      patientName: "",
      pharmacyName: payload.pharmacyName,
      reason: payload.rejectReason || "",
    });
  } else {
    const baseData = { patientName: "", pharmacyName: payload.pharmacyName, diagnosis: payload.prescriptionDiagnosis };
    switch (payload.status) {
      case "PENDING": emailHtml = pharmacyFulfillmentReceivedEmail(baseData); break;
      case "ACCEPTED": emailHtml = pharmacyFulfillmentAcceptedEmail(baseData); break;
      case "READY": emailHtml = pharmacyFulfillmentReadyEmail(baseData); break;
      case "COMPLETED": emailHtml = pharmacyFulfillmentCompletedEmail(baseData); break;
    }
  }

  notifyAndEmail(
    {
      userId: payload.patientUserId,
      type: `PHARMACY_FULFILLMENT_${payload.status}` as never,
      title: config.title,
      message: config.message,
      link: `/patient/pharmacy-orders`,
      metadata: { fulfillmentId: payload.fulfillmentId },
    },
    (await hasNotificationEnabled(payload.patientUserId, "pharmacyUpdates"))
      ? {
          to: (await getUserEmail(payload.patientUserId)) || "",
          subject: `${config.title} - Carely`,
          html: emailHtml,
          type: `PHARMACY_FULFILLMENT_${payload.status}`,
        }
      : undefined,
  );
}
