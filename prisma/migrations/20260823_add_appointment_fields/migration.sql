-- AlterEnum: Add PENDING to AppointmentStatus
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'CONFIRMED';

-- AlterTable: Add appointmentDuration to doctors
ALTER TABLE "doctors" ADD COLUMN "appointmentDuration" INTEGER NOT NULL DEFAULT 30;
