-- Add doctor-entered medicine name; catalog link becomes optional.

ALTER TABLE "prescription_items" ADD COLUMN "medicineName" TEXT;

UPDATE "prescription_items" pi
SET "medicineName" = m.name
FROM "medicines" m
WHERE pi."medicineId" = m.id;

UPDATE "prescription_items"
SET "medicineName" = 'Unknown medicine'
WHERE "medicineName" IS NULL;

ALTER TABLE "prescription_items" ALTER COLUMN "medicineName" SET NOT NULL;

ALTER TABLE "prescription_items" DROP CONSTRAINT "prescription_items_medicineId_fkey";
ALTER TABLE "prescription_items" ALTER COLUMN "medicineId" DROP NOT NULL;
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medicineId_fkey"
  FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
