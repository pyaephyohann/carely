-- AlterEnum: Add DRAFT and FINALIZED to PrescriptionStatus
ALTER TYPE "PrescriptionStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "PrescriptionStatus" ADD VALUE IF NOT EXISTS 'FINALIZED';

-- Add treatmentPlan column to MedicalRecord
ALTER TABLE "medical_records" ADD COLUMN "treatmentPlan" TEXT;
