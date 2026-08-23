import { logError } from "@/lib/logger";
/**
 * Database-backed reminder scheduling service.
 *
 * Architecture:
 *   Appointment created → Schedule reminder (24h before, 1h before)
 *   External cron/queue → Process due reminders → Send notification + email
 *
 * This is NOT an in-memory setTimeout. Reminders survive server restarts.
 * A production cron job (e.g., Vercel Cron, external scheduler) should call
 * processDueReminders() periodically.
 *
 * Idempotency: Each reminder type per entity is unique, preventing duplicates.
 */

import { prisma } from "@/lib/prisma";
import { notifyAndEmail } from "./notification-service";
import { appointmentReminderEmail } from "./templates/appointment";

// =============================================================================
// Schedule a reminder when an appointment is created
// =============================================================================

export async function scheduleAppointmentReminders(data: {
  appointmentId: string;
  patientUserId: string;
  doctorName: string;
  patientName: string;
  appointmentTime: Date;
}): Promise<void> {
  try {
    if (!prisma) return;

    const { appointmentId, patientUserId, appointmentTime } = data;

    // Schedule 24-hour reminder
    const reminder24h = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > new Date()) {
      await prisma.scheduledReminder.upsert({
        where: {
          entityType_entityId_type: {
            entityType: "APPOINTMENT",
            entityId: appointmentId,
            type: "APPOINTMENT_REMINDER_24H",
          },
        },
        create: {
          userId: patientUserId,
          entityType: "APPOINTMENT",
          entityId: appointmentId,
          type: "APPOINTMENT_REMINDER_24H",
          scheduledFor: reminder24h,
        },
        update: {}, // no-op if already exists
      });
    }

    // Schedule 1-hour reminder
    const reminder1h = new Date(appointmentTime.getTime() - 1 * 60 * 60 * 1000);
    if (reminder1h > new Date()) {
      await prisma.scheduledReminder.upsert({
        where: {
          entityType_entityId_type: {
            entityType: "APPOINTMENT",
            entityId: appointmentId,
            type: "APPOINTMENT_REMINDER_1H",
          },
        },
        create: {
          userId: patientUserId,
          entityType: "APPOINTMENT",
          entityId: appointmentId,
          type: "APPOINTMENT_REMINDER_1H",
          scheduledFor: reminder1h,
        },
        update: {},
      });
    }
  } catch (error) {
    logError("Failed to schedule reminders:", error);
  }
}

// =============================================================================
// Process due reminders (called by external cron/scheduler)
// =============================================================================

export async function processDueReminders(): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  try {
    if (!prisma) return { processed: 0, failed: 0 };

    // Find all due, unsent reminders
    const dueReminders = await prisma.scheduledReminder.findMany({
      where: {
        sent: false,
        scheduledFor: { lte: new Date() },
      },
      take: 50, // Process in batches
    });

    for (const reminder of dueReminders) {
      try {
        await processReminder(reminder);
        processed++;
      } catch (error) {
        logError(`Failed to process reminder ${reminder.id}:`, error);
        failed++;
      }
    }
  } catch (error) {
    logError("Failed to fetch due reminders:", error);
  }

  return { processed, failed };
}

// =============================================================================
// Process a single reminder
// =============================================================================

async function processReminder(reminder: {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  type: string;
}): Promise<void> {
  if (!prisma) return;

  // Mark as sent first (idempotency — prevents duplicate sends on retry)
  await prisma.scheduledReminder.update({
    where: { id: reminder.id },
    data: { sent: true, sentAt: new Date() },
  });

  if (reminder.entityType === "APPOINTMENT") {
    // Fetch appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: reminder.entityId },
      include: {
        doctor: { select: { firstName: true, lastName: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    if (!appointment || appointment.status === "CANCELLED") {
      return; // Don't remind about cancelled appointments
    }

    const doctorName = `${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
    const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
    const dateStr = appointment.startTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = appointment.startTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const hoursUntil = reminder.type === "APPOINTMENT_REMINDER_24H" ? 24 : 1;

    notifyAndEmail(
      {
        userId: reminder.userId,
        type: "APPOINTMENT_REMINDER",
        title: "Appointment Reminder",
        message: `You have an appointment with Dr. ${doctorName} in ${hoursUntil === 1 ? "1 hour" : `${hoursUntil} hours`}.`,
        link: `/patient/appointments`,
        metadata: { appointmentId: appointment.id },
      },
      {
        to: "", // Email service will look up the user's email
        subject: `Appointment Reminder - ${hoursUntil === 1 ? "1 Hour" : "24 Hours"} - Carely`,
        html: appointmentReminderEmail({
          patientName,
          doctorName,
          date: dateStr,
          time: timeStr,
          hoursUntil,
        }),
        type: "APPOINTMENT_REMINDER",
      },
    );
  }
}

// =============================================================================
// Cancel reminders (when appointment is cancelled)
// =============================================================================

export async function cancelAppointmentReminders(appointmentId: string): Promise<void> {
  try {
    if (!prisma) return;

    await prisma.scheduledReminder.updateMany({
      where: {
        entityType: "APPOINTMENT",
        entityId: appointmentId,
        sent: false,
      },
      data: { sent: true, sentAt: new Date() }, // Mark as sent to prevent processing
    });
  } catch (error) {
    logError("Failed to cancel reminders:", error);
  }
}
