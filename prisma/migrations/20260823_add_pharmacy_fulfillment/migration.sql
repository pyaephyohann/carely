-- Add PHARMACY to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PHARMACY';

-- Add FulfillmentStatus enum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- Add InventoryTransactionType enum
CREATE TYPE "InventoryTransactionType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'FULFILLMENT');

-- Update Pharmacy model
ALTER TABLE "pharmacies" ADD COLUMN "description" TEXT;
ALTER TABLE "pharmacies" ADD COLUMN "logo" TEXT;
ALTER TABLE "pharmacies" ADD COLUMN "openingHours" JSONB;
ALTER TABLE "pharmacies" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "pharmacies" ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- Update PharmacyMedicine model
ALTER TABLE "pharmacy_medicines" ADD COLUMN "minimumStock" INTEGER NOT NULL DEFAULT 0;

-- Create pharmacy_staff table
CREATE TABLE "pharmacy_staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pharmacy_staff_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pharmacy_staff_userId_key" ON "pharmacy_staff"("userId");
CREATE INDEX "pharmacy_staff_userId_idx" ON "pharmacy_staff"("userId");
CREATE INDEX "pharmacy_staff_pharmacyId_idx" ON "pharmacy_staff"("pharmacyId");

-- Create inventory_transactions table
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "pharmacy_medicine_id" TEXT NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "reason" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "inventory_transactions_pharmacy_medicine_id_idx" ON "inventory_transactions"("pharmacy_medicine_id");
CREATE INDEX "inventory_transactions_type_idx" ON "inventory_transactions"("type");
CREATE INDEX "inventory_transactions_createdAt_idx" ON "inventory_transactions"("createdAt");

-- Create prescription_fulfillments table
CREATE TABLE "prescription_fulfillments" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "prescription_fulfillments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "prescription_fulfillments_prescriptionId_key" ON "prescription_fulfillments"("prescriptionId");
CREATE INDEX "prescription_fulfillments_pharmacyId_idx" ON "prescription_fulfillments"("pharmacyId");
CREATE INDEX "prescription_fulfillments_patientId_idx" ON "prescription_fulfillments"("patientId");
CREATE INDEX "prescription_fulfillments_status_idx" ON "prescription_fulfillments"("status");

-- Create prescription_fulfillment_items table
CREATE TABLE "prescription_fulfillment_items" (
    "id" TEXT NOT NULL,
    "fulfillmentId" TEXT NOT NULL,
    "pharmacyMedicineId" TEXT,
    "medicineName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "fulfilled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "prescription_fulfillment_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "prescription_fulfillment_items_fulfillmentId_idx" ON "prescription_fulfillment_items"("fulfillmentId");

-- Add foreign keys
ALTER TABLE "pharmacy_staff" ADD CONSTRAINT "pharmacy_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pharmacy_staff" ADD CONSTRAINT "pharmacy_staff_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_pharmacy_medicine_id_fkey" FOREIGN KEY ("pharmacy_medicine_id") REFERENCES "pharmacy_medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescription_fulfillments" ADD CONSTRAINT "prescription_fulfillments_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescription_fulfillments" ADD CONSTRAINT "prescription_fulfillments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescription_fulfillments" ADD CONSTRAINT "prescription_fulfillments_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescription_fulfillment_items" ADD CONSTRAINT "prescription_fulfillment_items_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "prescription_fulfillments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescription_fulfillment_items" ADD CONSTRAINT "prescription_fulfillment_items_pharmacyMedicineId_fkey" FOREIGN KEY ("pharmacyMedicineId") REFERENCES "pharmacy_medicines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
