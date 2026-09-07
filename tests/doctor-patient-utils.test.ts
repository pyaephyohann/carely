import { describe, it, expect } from "vitest";
import { computePatientAge, formatGender } from "@/lib/doctor-patient-utils";

describe("computePatientAge", () => {
  it("returns null when date of birth is missing", () => {
    expect(computePatientAge(null)).toBeNull();
    expect(computePatientAge(undefined)).toBeNull();
  });

  it("computes age from date of birth", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 30);
    expect(computePatientAge(dob)).toBe(30);
  });
});

describe("formatGender", () => {
  it("formats enum-style gender values", () => {
    expect(formatGender("PREFER_NOT_TO_SAY")).toBe("Prefer Not To Say");
    expect(formatGender("MALE")).toBe("Male");
  });

  it("returns null for empty values", () => {
    expect(formatGender(null)).toBeNull();
    expect(formatGender(undefined)).toBeNull();
  });
});
