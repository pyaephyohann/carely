import { describe, expect, it } from "vitest";
import {
  getAppointmentDetailErrorPresentation,
  getFetchErrorStatus,
} from "@/lib/appointment-utils";
import { doctorAppointmentDetailPath } from "@/hooks/useDoctorAppointmentNavigation";

describe("doctor appointment detail navigation", () => {
  it("builds the shared appointment detail route from list/dashboard IDs", () => {
    const id = "cmt7hu0rl0000icohwemlj891";
    expect(doctorAppointmentDetailPath(id)).toBe(`/doctor/appointments/${id}`);
  });
});

describe("getAppointmentDetailErrorPresentation", () => {
  it("detects missing route IDs", () => {
    const result = getAppointmentDetailErrorPresentation(null, undefined);
    expect(result?.kind).toBe("missing_id");
    expect(result?.title).toBe("Invalid appointment link");
  });

  it("maps 404 to not found", () => {
    const result = getAppointmentDetailErrorPresentation({ status: 404 }, "abc123");
    expect(result?.kind).toBe("not_found");
    expect(result?.title).toBe("Appointment not found");
  });

  it("maps 401 to session expired", () => {
    const result = getAppointmentDetailErrorPresentation({ status: 401 }, "abc123");
    expect(result?.kind).toBe("unauthorized");
    expect(result?.title).toBe("Session expired");
  });

  it("maps 403 to access denied", () => {
    const result = getAppointmentDetailErrorPresentation({ status: 403 }, "abc123");
    expect(result?.kind).toBe("forbidden");
    expect(result?.title).toBe("Access denied");
  });

  it("maps 500 to server error with retry", () => {
    const result = getAppointmentDetailErrorPresentation({ status: 500 }, "abc123");
    expect(result?.kind).toBe("server");
    expect(result?.canRetry).toBe(true);
  });

  it("maps fetch failures to network errors", () => {
    const result = getAppointmentDetailErrorPresentation({ status: "FETCH_ERROR" }, "abc123");
    expect(result?.kind).toBe("network");
    expect(result?.canRetry).toBe(true);
  });
});

describe("getFetchErrorStatus", () => {
  it("reads RTK-style error status values", () => {
    expect(getFetchErrorStatus({ status: 404 })).toBe(404);
    expect(getFetchErrorStatus({ status: "FETCH_ERROR" })).toBe("FETCH_ERROR");
  });
});
