import { describe, it, expect } from "vitest";
import {
  CLINICAL_APPOINTMENT_STATUSES,
  isClinicalAppointmentStatus,
} from "@/lib/prescription-service";
import { prescriptionCreateSchema } from "@/lib/validation";

describe("isClinicalAppointmentStatus", () => {
  it("allows CONFIRMED and COMPLETED", () => {
    for (const status of CLINICAL_APPOINTMENT_STATUSES) {
      expect(isClinicalAppointmentStatus(status)).toBe(true);
    }
  });

  it("rejects PENDING and CANCELLED", () => {
    expect(isClinicalAppointmentStatus("PENDING")).toBe(false);
    expect(isClinicalAppointmentStatus("CANCELLED")).toBe(false);
  });
});

describe("prescriptionCreateSchema", () => {
  const baseItem = {
    medicineName: "Paracetamol",
    dosage: "500mg",
    frequency: "2x daily",
    duration: "5 days",
  };

  it("accepts appointmentId without consultationId", () => {
    const result = prescriptionCreateSchema.safeParse({
      appointmentId: "appt-1",
      diagnosis: "Hypertension",
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("accepts consultationId without appointmentId", () => {
    const result = prescriptionCreateSchema.safeParse({
      consultationId: "consult-1",
      diagnosis: "Hypertension",
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("rejects when neither appointmentId nor consultationId is provided", () => {
    const result = prescriptionCreateSchema.safeParse({
      diagnosis: "Hypertension",
      items: [baseItem],
    });
    expect(result.success).toBe(false);
  });
});
