-- New appointments require doctor acceptance before confirmation.
-- Does NOT rewrite existing appointment rows.
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
