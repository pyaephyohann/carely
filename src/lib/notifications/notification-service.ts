/**
 * Centralized notification service.
 *
 * Architecture:
 *   Business Event → NotificationService.create() → In-App Notification + Email (fire-and-forget)
 *
 * Core business operations are NEVER dependent on successful notification delivery.
 * All email/notification failures are logged and can be retried.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { CreateNotificationInput } from "./notification-types";
import { sendNotificationEmail } from "./email-service";

// =============================================================================
// Core: Create In-App Notification
// =============================================================================

export async function createNotification(input: CreateNotificationInput): Promise<string | null> {
  try {
    if (!prisma) return null;

    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type as never, // Prisma enum
        title: input.title,
        message: input.message,
        link: input.link || null,
        metadata: (input.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
      },
    });

    return notification.id;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

// =============================================================================
// Core: Create Notification + Send Email (fire-and-forget)
// =============================================================================

export async function notifyAndEmail(
  input: CreateNotificationInput,
  emailOptions?: {
    to: string;
    subject: string;
    html: string;
    type: string;
  },
): Promise<void> {
  // 1. Create in-app notification (non-blocking)
  const notificationId = await createNotification(input);

  // 2. Send email if provided (non-blocking, fire-and-forget)
  if (emailOptions) {
    sendNotificationEmail({
      userId: input.userId,
      to: emailOptions.to,
      subject: emailOptions.subject,
      html: emailOptions.html,
      type: emailOptions.type,
      metadata: {
        notificationId,
        ...input.metadata,
      },
    }).catch((err) => {
      // Email failure must NOT break the operation
      console.error("Email delivery failed (non-critical):", err);
    });
  }
}

// =============================================================================
// Batch: Create multiple notifications at once
// =============================================================================

export async function createNotifications(inputs: CreateNotificationInput[]): Promise<string[]> {
  try {
    if (!prisma || inputs.length === 0) return [];

    const created = await prisma.notification.createMany({
      data: inputs.map((input) => ({
        userId: input.userId,
        type: input.type as never,
        title: input.title,
        message: input.message,
        link: input.link || null,
        metadata: (input.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
      })),
    });

    return Array.from({ length: created.count }, (_, i) => `batch-${i}`);
  } catch (error) {
    console.error("Failed to create batch notifications:", error);
    return [];
  }
}

// =============================================================================
// Read / Unread operations
// =============================================================================

export async function markAsRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    if (!prisma) return false;

    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true, readAt: new Date() },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return false;
  }
}

export async function markAllAsRead(userId: string): Promise<number> {
  try {
    if (!prisma) return 0;

    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    return result.count;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return 0;
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    if (!prisma) return 0;

    return await prisma.notification.count({
      where: { userId, read: false },
    });
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
}

// =============================================================================
// Preferences
// =============================================================================

export async function getNotificationPreferences(userId: string) {
  try {
    if (!prisma) return null;

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if none exist
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  } catch (error) {
    console.error("Failed to get notification preferences:", error);
    return null;
  }
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<{
    appointmentUpdates: boolean;
    appointmentReminders: boolean;
    prescriptionUpdates: boolean;
    pharmacyUpdates: boolean;
    emailEnabled: boolean;
  }>,
) {
  try {
    if (!prisma) return null;

    return await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...updates },
      update: updates,
    });
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    return null;
  }
}
