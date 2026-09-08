import { describe, it, expect } from "vitest";
import {
  displayMedicineName,
  buildPrescriptionItemCreateData,
  mapPrescriptionItemResponse,
} from "@/lib/prescription-item-utils";
import { prescriptionItemSchema } from "@/lib/validation";

describe("prescriptionItemSchema", () => {
  it("requires medicineName and trims whitespace", () => {
    const result = prescriptionItemSchema.safeParse({
      medicineName: "  Paracetamol  ",
      dosage: "500 mg",
      frequency: "Twice daily",
      duration: "5 days",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.medicineName).toBe("Paracetamol");
    }
  });

  it("rejects empty medicine name", () => {
    const result = prescriptionItemSchema.safeParse({
      medicineName: "   ",
      dosage: "500 mg",
      frequency: "Twice daily",
      duration: "5 days",
    });
    expect(result.success).toBe(false);
  });
});

describe("prescription item utils", () => {
  it("uses stored medicineName for display", () => {
    expect(
      displayMedicineName({
        medicineName: "Vitamin D3",
        medicine: { name: "Catalog Name" },
      }),
    ).toBe("Vitamin D3");
  });

  it("builds create data without catalog id", () => {
    expect(
      buildPrescriptionItemCreateData({
        medicineName: " Amoxicillin ",
        dosage: "500 mg",
        frequency: "3x daily",
        duration: "7 days",
      }),
    ).toEqual({
      medicineName: "Amoxicillin",
      medicineId: null,
      dosage: "500 mg",
      frequency: "3x daily",
      duration: "7 days",
      instructions: null,
    });
  });

  it("maps API response with free-text medicine", () => {
    expect(
      mapPrescriptionItemResponse({
        id: "item-1",
        medicineId: null,
        medicineName: "Paracetamol",
        dosage: "500 mg",
        frequency: "Twice daily",
        duration: "5 days",
        instructions: "After meals",
        medicine: null,
      }),
    ).toMatchObject({
      medicineName: "Paracetamol",
      medicineId: null,
      dosage: "500 mg",
    });
  });
});
