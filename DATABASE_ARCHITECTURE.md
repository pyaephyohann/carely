# Carely Database Architecture

## Overview

PostgreSQL database managed via Prisma ORM. Schema designed for a healthcare appointment and pharmacy platform supporting patients, doctors, pharmacies, and administrators.

## Entity Responsibilities

### Identity Layer

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **User** | Core authentication entity. One account = one role. | email, passwordHash, role, status |
| **Patient** | Patient profile extending User | firstName, lastName, dateOfBirth, gender |
| **Doctor** | Professional profile extending User | licenseNumber, specialization, consultationFee, verified |
| **Admin** | Admin profile extending User | firstName, lastName |

**Design Decision**: User contains role and authentication data. Profile tables (Patient, Doctor, Admin) extend User with role-specific information. This avoids duplicated identity data while allowing role-specific fields.

### Doctor Scheduling

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **Specialization** | Medical specialty catalog | name, slug |
| **DoctorSchedule** | Weekly recurring working hours | dayOfWeek, startTime, endTime, active |
| **DoctorAvailability** | Date-specific exceptions | date, available, startTime, endTime, reason |

### Appointments & Consultations

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **Appointment** | Scheduled meeting between patient and doctor | startTime, endTime, status, type |
| **Consultation** | Medical record of the appointment | diagnosis, symptoms, notes |

### Prescriptions

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **Prescription** | Prescription issued by doctor | diagnosis, status, validUntil |
| **PrescriptionItem** | Individual medicine in prescription | dosage, frequency, duration |

### Pharmacy & Medicine

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **Medicine** | Global medicine catalog | name, category, dosageForms |
| **Pharmacy** | Pharmacy profile | name, address, licenseNumber |
| **PharmacyMedicine** | Pharmacy-specific inventory | stock, price, inStock |

### Platform

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **MedicalRecord** | Patient medical records | type, title, attachments |
| **Review** | Patient review of doctor | rating, comment |
| **Notification** | User notifications | type, title, message, read |
| **AuditLog** | Compliance audit trail | action, entityType, entityId, metadata |

---

## Important Relationships

```
User (1) ──── (1) Patient
User (1) ──── (1) Doctor
User (1) ──── (1) Admin

Doctor (many) ──── (1) Specialization
Doctor (1) ──── (many) DoctorSchedule
Doctor (1) ──── (many) DoctorAvailability

Patient (1) ──── (many) Appointment
Doctor (1) ──── (many) Appointment

Appointment (1) ──── (0..1) Consultation
Consultation (1) ──── (many) Prescription
Prescription (1) ──── (many) PrescriptionItem
PrescriptionItem (many) ──── (1) Medicine

Pharmacy (1) ──── (many) PharmacyMedicine
Medicine (1) ──── (many) PharmacyMedicine

Patient (1) ──── (many) MedicalRecord
Doctor (1) ──── (many) MedicalRecord
Consultation (1) ──── (many) MedicalRecord

Appointment (1) ──── (0..1) Review
Patient (1) ──── (many) Review
Doctor (1) ──── (many) Review
```

---

## Scheduling Strategy

### Rule-Based, Not Slot-Based

**Approach**: Store recurring rules and exceptions, generate slots dynamically at query time.

1. **DoctorSchedule** stores weekly recurring hours (e.g., "Monday 09:00-17:00")
2. **DoctorAvailability** stores exceptions (vacation, one-off changes)
3. **Available slots computed dynamically** by:
   - Generating time slots from DoctorSchedule for the target week
   - Subtracting DoctorAvailability exceptions
   - Subtracting existing booked Appointments

**Why not pre-generate slots?**
- Slots would need regeneration on every schedule change
- High write volume for frequent updates
- Complex slot lifecycle management
- Dynamic generation is more flexible and efficient

### Timezone Handling

- All timestamps stored as **UTC** in PostgreSQL (`TIMESTAMPTZ`)
- Doctor timezone stored as IANA string (e.g., "America/New_York")
- Display timezone conversion happens at application level
- Use `date-fns-tz` for timezone conversions in the frontend

---

## Double-Booking Protection

### Strategy: Database Constraint + Application Transaction

**Layer 1: Database Unique Constraint**
```sql
UNIQUE(doctorId, startTime)
```
Prevents two appointments with the same doctor and start time.

**Layer 2: Application-Level Transaction**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock the doctor's schedule for the time period
  const existing = await tx.appointment.findFirst({
    where: {
      doctorId,
      startTime: { gte: slotStart },
      endTime: { lte: slotEnd },
      status: { notIn: ['CANCELLED'] }
    }
  });
  
  if (existing) throw new Error('Time slot not available');
  
  // 2. Create the appointment
  return tx.appointment.create({ data: {...} });
});
```

**Why not PostgreSQL exclusion constraints?**
- tsrange exclusion constraints are powerful but add complexity
- For MVP, unique constraint on (doctorId, startTime) is sufficient
- Can upgrade to exclusion constraints later if needed

---

## Important Indexes

### Performance-Critical Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| appointments | `(doctorId, startTime)` | Scheduling queries, double-booking check |
| appointments | `(patientId)` | Patient's appointment history |
| appointments | `(startTime)` | Date range queries |
| doctor_schedules | `(doctorId, dayOfWeek)` | Schedule lookups |
| doctor_availability | `(doctorId, date)` | Availability exceptions |
| reviews | `(doctorId)` | Doctor review queries |
| notifications | `(userId, read)` | Unread notification count |
| audit_logs | `(entityType, entityId)` | Entity audit history |

---

## Important Constraints

| Constraint | Table | Purpose |
|------------|-------|---------|
| `UNIQUE(email)` | users | Prevent duplicate accounts |
| `UNIQUE(userId)` | patients, doctors, admins | One profile per user |
| `UNIQUE(licenseNumber)` | doctors | One license per doctor |
| `UNIQUE(doctorId, dayOfWeek)` | doctor_schedules | One schedule per day per doctor |
| `UNIQUE(doctorId, date)` | doctor_availability | One exception per date per doctor |
| `UNIQUE(doctorId, startTime)` | appointments | Prevent double-booking |
| `UNIQUE(appointmentId)` | consultations | One consultation per appointment |
| `UNIQUE(pharmacyId, medicineId)` | pharmacy_medicines | One inventory entry per medicine per pharmacy |
| `UNIQUE(appointmentId)` | reviews | One review per appointment |
| `FOREIGN KEY onDelete` | All | Cascade/Restrict as appropriate |

---

## Soft Delete Strategy

| Entity | Strategy | Reason |
|--------|----------|--------|
| User | `deletedAt` timestamp | Preserve audit trail |
| Pharmacy | `deletedAt` timestamp | Preserve medicine history |
| Appointment | Status `CANCELLED` | Status-based, not deletion |
| Other entities | Hard delete | No retention requirement |

---

## Future Extensibility

### Ready for Extension
- **Multiple specializations**: Add `DoctorSpecialization` join table
- **Telehealth**: `AppointmentType` enum includes VIRTUAL
- **Pharmacy fulfillment**: PharmacyMedicine links prescriptions to pharmacies
- **Complex scheduling**: DoctorSchedule supports per-day rules

### May Need Later
- **Payment processing**: Add Payment entity linked to Appointment
- **Insurance**: Add InsuranceProvider and PatientInsurance entities
- **Multi-language**: Add translation tables for content
- **File storage**: MedicalRecord attachments may need dedicated storage

---

## Migration Status

- **Schema**: Created in `prisma/schema.prisma`
- **Config**: `prisma.config.ts` at project root
- **Migration SQL**: Generated at `prisma/migrations/0_init/migration.sql`
- **Prisma Client**: Generated and ready to use
- **Database**: Requires PostgreSQL connection for migration

---

*Last Updated: August 23, 2026*
