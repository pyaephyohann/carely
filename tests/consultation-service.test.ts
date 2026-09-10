import { describe, expect, it } from "vitest";
import {
  buildDoctorConsultationListWhere,
  getConsultationCreateDenial,
  shouldCompleteAppointmentOnConsultationCreate,
} from "@/lib/consultation-service";

describe("getConsultationCreateDenial", () => {
  it("returns 403 FORBIDDEN when the doctor does not own the appointment", () => {
    const result = getConsultationCreateDenial({
      isOwner: false,
      hasExistingConsultation: false,
      appointmentStatus: "CONFIRMED",
    });
    expect(result).toEqual({ code: "FORBIDDEN", httpStatus: 403 });
  });

  it("returns 409 ALREADY_EXISTS before status checks", () => {
    const result = getConsultationCreateDenial({
      isOwner: true,
      hasExistingConsultation: true,
      appointmentStatus: "PENDING",
    });
    expect(result).toEqual({ code: "ALREADY_EXISTS", httpStatus: 409 });
  });

  it("allows CONFIRMED appointments with no existing consultation", () => {
    expect(
      getConsultationCreateDenial({
        isOwner: true,
        hasExistingConsultation: false,
        appointmentStatus: "CONFIRMED",
      }),
    ).toBeNull();
  });

  it("allows COMPLETED appointments that do not already have a consultation", () => {
    expect(
      getConsultationCreateDenial({
        isOwner: true,
        hasExistingConsultation: false,
        appointmentStatus: "COMPLETED",
      }),
    ).toBeNull();
  });

  it.each(["PENDING", "CANCELLED", "NO_SHOW"] as const)(
    "returns 422 INVALID_STATUS for %s appointments",
    (status) => {
      const result = getConsultationCreateDenial({
        isOwner: true,
        hasExistingConsultation: false,
        appointmentStatus: status,
      });
      expect(result).toEqual({ code: "INVALID_STATUS", httpStatus: 422 });
    },
  );
});

describe("shouldCompleteAppointmentOnConsultationCreate", () => {
  it("completes CONFIRMED appointments", () => {
    expect(shouldCompleteAppointmentOnConsultationCreate("CONFIRMED")).toBe(true);
  });

  it("does not change COMPLETED, PENDING, CANCELLED, or NO_SHOW", () => {
    expect(shouldCompleteAppointmentOnConsultationCreate("COMPLETED")).toBe(false);
    expect(shouldCompleteAppointmentOnConsultationCreate("PENDING")).toBe(false);
    expect(shouldCompleteAppointmentOnConsultationCreate("CANCELLED")).toBe(false);
    expect(shouldCompleteAppointmentOnConsultationCreate("NO_SHOW")).toBe(false);
  });
});

describe("buildDoctorConsultationListWhere", () => {
  it("always scopes to the authenticated doctor id", () => {
    expect(buildDoctorConsultationListWhere("doc_1")).toEqual({ doctorId: "doc_1" });
  });

  it("ignores blank search", () => {
    expect(buildDoctorConsultationListWhere("doc_1", "   ")).toEqual({ doctorId: "doc_1" });
  });

  it("searches patient name, diagnosis, symptoms, notes, and appointment reason", () => {
    const where = buildDoctorConsultationListWhere("doc_1", "fever");
    expect(where.doctorId).toBe("doc_1");
    expect(where.AND).toBeDefined();
    const and = where.AND as unknown[];
    expect(JSON.stringify(and)).toContain("fever");
    expect(JSON.stringify(and)).toContain("firstName");
    expect(JSON.stringify(and)).toContain("diagnosis");
    expect(JSON.stringify(and)).toContain("reason");
  });

  it("never includes a client-supplied doctorId field", () => {
    const where = buildDoctorConsultationListWhere("session-doctor", "fever");
    expect(where.doctorId).toBe("session-doctor");
    expect(where).not.toHaveProperty("doctor");
  });
});
