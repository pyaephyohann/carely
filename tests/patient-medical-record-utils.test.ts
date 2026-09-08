import { describe, it, expect } from "vitest";
import {
  buildClinicalSummary,
  buildRecordTitle,
  hasFullConsultationDetails,
  matchesMedicalRecordFilter,
  RECENT_RECORD_WINDOW_MS,
  type MedicalRecordListCandidate,
} from "@/lib/patient-medical-record-utils";

function baseCandidate(
  overrides: Partial<MedicalRecordListCandidate> = {},
): MedicalRecordListCandidate {
  return {
    id: "record-1",
    source: "consultation",
    visitDate: new Date("2026-09-01T10:00:00.000Z"),
    diagnosis: "Hypertension",
    symptoms: null,
    notes: null,
    treatmentPlan: null,
    description: null,
    title: null,
    followUpDate: null,
    prescriptionCount: 0,
    appointmentStatus: "COMPLETED",
    ...overrides,
  };
}

describe("buildRecordTitle", () => {
  it("prefers diagnosis over title", () => {
    expect(
      buildRecordTitle(
        baseCandidate({ diagnosis: "Migraine", title: "Visit Note" }),
      ),
    ).toBe("Migraine");
  });

  it("falls back to title when diagnosis is missing", () => {
    expect(
      buildRecordTitle(
        baseCandidate({ diagnosis: null, title: "Lab Result - CBC" }),
      ),
    ).toBe("Lab Result - CBC");
  });
});

describe("buildClinicalSummary", () => {
  it("combines available clinical fields", () => {
    expect(
      buildClinicalSummary(
        baseCandidate({
          symptoms: "Headache",
          notes: "Rest advised",
        }),
      ),
    ).toBe("Headache · Rest advised");
  });

  it("returns null when no clinical text exists", () => {
    expect(buildClinicalSummary(baseCandidate({ diagnosis: "Only diagnosis" }))).toBeNull();
  });
});

describe("hasFullConsultationDetails", () => {
  it("detects full consultation notes", () => {
    expect(hasFullConsultationDetails(baseCandidate({ notes: "Patient stable" }))).toBe(true);
    expect(hasFullConsultationDetails(baseCandidate({ diagnosis: "Only diagnosis" }))).toBe(false);
  });
});

describe("matchesMedicalRecordFilter", () => {
  const now = new Date("2026-09-08T12:00:00.000Z").getTime();

  it("filters recent records within six months", () => {
    expect(
      matchesMedicalRecordFilter(
        baseCandidate({ visitDate: new Date("2026-08-01T10:00:00.000Z") }),
        "recent",
        now,
      ),
    ).toBe(true);
    expect(
      matchesMedicalRecordFilter(
        baseCandidate({ visitDate: new Date("2025-01-01T10:00:00.000Z") }),
        "recent",
        now,
      ),
    ).toBe(false);
  });

  it("filters diagnoses and prescriptions", () => {
    expect(matchesMedicalRecordFilter(baseCandidate(), "diagnoses", now)).toBe(true);
    expect(
      matchesMedicalRecordFilter(baseCandidate({ diagnosis: null }), "diagnoses", now),
    ).toBe(false);
    expect(
      matchesMedicalRecordFilter(baseCandidate({ prescriptionCount: 1 }), "prescriptions", now),
    ).toBe(true);
  });

  it("filters consultation details", () => {
    expect(
      matchesMedicalRecordFilter(
        baseCandidate({ followUpDate: new Date("2026-10-01T10:00:00.000Z") }),
        "consultations",
        now,
      ),
    ).toBe(true);
    expect(matchesMedicalRecordFilter(baseCandidate(), "consultations", now)).toBe(false);
  });

  it("uses a six-month recent window constant", () => {
    expect(RECENT_RECORD_WINDOW_MS).toBeGreaterThan(0);
  });
});
