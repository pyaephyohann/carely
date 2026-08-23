-- Expand NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_BOOKED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PRESCRIPTION_FINALIZED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHARMACY_FULFILLMENT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHARMACY_FULFILLMENT_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHARMACY_FULFILLMENT_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHARMACY_FULFILLMENT_READY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHARMACY_FULFILLMENT_COMPLETED';

-- Add link and readAt to Notification
ALTER TABLE "notifications" ADD COLUMN "link" TEXT;
ALTER TABLE "notifications" ADD COLUMN "readAt" TIMESTAMP(3);
CREATE INDEX "notifications_readAt_idx" ON "notifications"("readAt");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- Create notification_preferences table
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appointmentUpdates" BOOLEAN NOT NULL DEFAULT true,
    "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "prescriptionUpdates" BOOLEAN NOT NULL DEFAULT true,
    "pharmacyUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- Create email_delivery_logs table
CREATE TABLE "email_delivery_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerId" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_delivery_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "email_delivery_logs_userId_idx" ON "email_delivery_logs"("userId");
CREATE INDEX "email_delivery_logs_status_idx" ON "email_delivery_logs"("status");
CREATE INDEX "email_delivery_logs_createdAt_idx" ON "email_delivery_logs"("createdAt");

-- Create scheduled_reminders table
CREATE TABLE "scheduled_reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scheduled_reminders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "scheduled_reminders_entityType_entityId_type_key" ON "scheduled_reminders"("entityType", "entityId", "type");
CREATE INDEX "scheduled_reminders_scheduledFor_sent_idx" ON "scheduled_reminders"("scheduledFor", "sent");
CREATE INDEX "scheduled_reminders_userId_idx" ON "scheduled_reminders"("userId");
