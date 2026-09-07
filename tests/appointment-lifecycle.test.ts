import { describe, it, expect } from "vitest";
import {
  isValidTransition,
  getValidTransitions,
  getAppointmentDisplayLabel,
  DOCTOR_REJECT_REASON,
} from "@/lib/appointment-utils";

describe("Appointment lifecycle transitions", () => {
  it("allows PENDING → CONFIRMED (doctor accept)", () => {
    expect(isValidTransition("PENDING", "CONFIRMED")).toBe(true);
  });

  it("allows PENDING → CANCELLED (doctor reject / patient cancel)", () => {
    expect(isValidTransition("PENDING", "CANCELLED")).toBe(true);
  });

  it("rejects PENDING → COMPLETED", () => {
    expect(isValidTransition("PENDING", "COMPLETED")).toBe(false);
  });

  it("rejects CANCELLED → CONFIRMED", () => {
    expect(isValidTransition("CANCELLED", "CONFIRMED")).toBe(false);
  });

  it("rejects COMPLETED → CONFIRMED", () => {
    expect(isValidTransition("COMPLETED", "CONFIRMED")).toBe(false);
  });

  it("allows CONFIRMED → COMPLETED / CANCELLED / NO_SHOW", () => {
    expect(getValidTransitions("CONFIRMED")).toEqual(
      expect.arrayContaining(["COMPLETED", "CANCELLED", "NO_SHOW"]),
    );
  });

  it("PENDING only allows accept or cancel/reject", () => {
    expect(getValidTransitions("PENDING")).toEqual(["CONFIRMED", "CANCELLED"]);
  });
});

describe("Doctor reject display (no REJECTED enum)", () => {
  it("maps doctor reject CANCELLED to Declined", () => {
    expect(
      getAppointmentDisplayLabel("CANCELLED", {
        cancelledBy: "DOCTOR",
        cancelReason: DOCTOR_REJECT_REASON,
      }),
    ).toBe("Declined");
  });

  it("keeps patient cancellations as Cancelled", () => {
    expect(
      getAppointmentDisplayLabel("CANCELLED", {
        cancelledBy: "PATIENT",
        cancelReason: null,
      }),
    ).toBe("Cancelled");
  });

  it("shows Pending and Confirmed normally", () => {
    expect(getAppointmentDisplayLabel("PENDING")).toBe("Pending");
    expect(getAppointmentDisplayLabel("CONFIRMED")).toBe("Confirmed");
  });
});
