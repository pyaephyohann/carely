-- Replace the unconditional unique index on (doctorId, startTime) with a partial
-- unique index that excludes CANCELLED appointments.
--
-- Problem: The old unique constraint prevented rebooking cancelled slots, because
-- the cancelled appointment still occupied the (doctorId, startTime) key.
-- This caused the availability API to report a slot as available (since only
-- PENDING/CONFIRMED were filtered) while the DB rejected the insert with P2002.
--
-- Solution: A partial unique index WHERE status <> 'CANCELLED' ensures that
-- only active appointments enforce the uniqueness constraint. Cancelled
-- appointments no longer block rebooking.

-- 1. Drop the old unconditional unique index
DROP INDEX IF EXISTS "appointments_doctorId_startTime_key";

-- 2. Create a partial unique index that excludes cancelled appointments.
--    Two non-cancelled appointments for the same doctor+time will be rejected
--    by the DB, but cancelled appointments are excluded from the constraint.
CREATE UNIQUE INDEX "appointments_doctorId_startTime_non_cancelled_key"
  ON "appointments"("doctorId", "startTime")
  WHERE "status" <> 'CANCELLED';
