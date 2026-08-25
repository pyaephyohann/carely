import { describe, it, expect } from "vitest";
import {
  generateAvailableSlots,
  isSlotValid,
  getEffectiveHours,
  type DoctorScheduleEntry,
  type DoctorAvailabilityException,
  type ExistingAppointment,
} from "@/lib/scheduling";

// =============================================================================
// Test Fixtures
// =============================================================================

const MONDAY_SCHEDULE: DoctorScheduleEntry[] = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", active: true },
];

const WEEKLY_SCHEDULE: DoctorScheduleEntry[] = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", active: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", active: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", active: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", active: true },
];

const NO_SCHEDULE: DoctorScheduleEntry[] = [];

const HALF_DAY_EXCEPTION: DoctorAvailabilityException[] = [
  { date: "2026-09-01", available: true, startTime: "13:00", endTime: "17:00" },
];

const BLOCKED_DAY_EXCEPTION: DoctorAvailabilityException[] = [
  { date: "2026-09-01", available: false, startTime: null, endTime: null },
];

// 2026-09-01 is a Tuesday (dayOfWeek=2)
// 2026-09-07 is a Monday (dayOfWeek=1)

// =============================================================================
// generateAvailableSlots
// =============================================================================

describe("generateAvailableSlots", () => {
  // Use a fixed "now" so tests are deterministic
  const now = new Date("2026-08-25T00:00:00.000Z");

  it("generates slots for a working day", () => {
    // 2026-09-01 is Tuesday
    const slots = generateAvailableSlots(
      "2026-09-01",
      "UTC",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      [],
      [],
      30,
      now,
    );

    // 09:00-17:00 with 30-min slots = 16 slots
    expect(slots.length).toBe(16);
    expect(slots[0].localStartTime).toBe("09:00");
    expect(slots[0].localEndTime).toBe("09:30");
    expect(slots[15].localStartTime).toBe("16:30");
    expect(slots[15].localEndTime).toBe("17:00");
  });

  it("returns empty for a non-working day", () => {
    // 2026-09-05 is Saturday (dayOfWeek=6) — no schedule
    const slots = generateAvailableSlots(
      "2026-09-05",
      "UTC",
      WEEKLY_SCHEDULE,
      [],
      [],
      30,
      now,
    );

    expect(slots.length).toBe(0);
  });

  it("returns empty when no schedule exists", () => {
    const slots = generateAvailableSlots(
      "2026-09-01",
      "UTC",
      NO_SCHEDULE,
      [],
      [],
      30,
      now,
    );

    expect(slots.length).toBe(0);
  });

  it("returns empty for a blocked day (exception not available)", () => {
    // 2026-09-01 is Tuesday
    const slots = generateAvailableSlots(
      "2026-09-01",
      "UTC",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      BLOCKED_DAY_EXCEPTION,
      [],
      30,
      now,
    );

    expect(slots.length).toBe(0);
  });

  it("respects half-day exception (shorter hours)", () => {
    // 2026-09-01 is Tuesday — exception limits to 13:00-17:00
    const slots = generateAvailableSlots(
      "2026-09-01",
      "UTC",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      HALF_DAY_EXCEPTION,
      [],
      30,
      now,
    );

    // 13:00-17:00 with 30-min slots = 8 slots
    expect(slots.length).toBe(8);
    expect(slots[0].localStartTime).toBe("13:00");
    expect(slots[7].localStartTime).toBe("16:30");
  });

  it("excludes slots with existing appointments", () => {
    const existingAppointments: ExistingAppointment[] = [
      {
        startTime: "2026-09-01T10:00:00.000Z",
        endTime: "2026-09-01T10:30:00.000Z",
      },
    ];

    const slots = generateAvailableSlots(
      "2026-09-01",
      "UTC",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      [],
      existingAppointments,
      30,
      now,
    );

    // 16 slots minus 1 = 15
    expect(slots.length).toBe(15);
    // The 10:00 slot should not be present
    const tenOClockSlot = slots.find((s) => s.localStartTime === "10:00");
    expect(tenOClockSlot).toBeUndefined();
  });

  it("handles 60-minute slots", () => {
    const slots = generateAvailableSlots(
      "2026-09-01",
      "UTC",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "12:00", active: true },
      ],
      [],
      [],
      60,
      now,
    );

    // 09:00-12:00 with 60-min slots = 3 slots
    expect(slots.length).toBe(3);
    expect(slots[0].localStartTime).toBe("09:00");
    expect(slots[1].localStartTime).toBe("10:00");
    expect(slots[2].localStartTime).toBe("11:00");
  });

  it("does not filter future slots that are today", () => {
    // All slots are in the future relative to our fixed "now"
    const slots = generateAvailableSlots(
      "2026-09-01",
      "UTC",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      [],
      [],
      30,
      now,
    );

    // All 16 slots should be returned since the date is in the future
    expect(slots.length).toBe(16);
  });

  it("generates correct UTC times for non-UTC timezone", () => {
    // UTC+7 timezone: 09:00 local = 02:00 UTC
    const slots = generateAvailableSlots(
      "2026-09-01",
      "Asia/Ho_Chi_Minh",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "12:00", active: true },
      ],
      [],
      [],
      60,
      now,
    );

    expect(slots.length).toBe(3);
    // First slot should be 02:00 UTC (09:00 Ho Chi Minh)
    expect(slots[0].startTime).toContain("T02:00:00");
    expect(slots[0].localStartTime).toBe("09:00");
  });
});

// =============================================================================
// isSlotValid
// =============================================================================

describe("isSlotValid", () => {
  it("returns true for a valid slot within working hours", () => {
    const result = isSlotValid(
      "2026-09-01",
      "10:00",
      "10:30",
      "UTC",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      [],
      30,
    );
    expect(result).toBe(true);
  });

  it("returns false for slot outside working hours", () => {
    const result = isSlotValid(
      "2026-09-01",
      "08:00",
      "08:30",
      "UTC",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      [],
      30,
    );
    expect(result).toBe(false);
  });

  it("returns false for non-working day", () => {
    // 2026-09-05 is Saturday
    const result = isSlotValid(
      "2026-09-05",
      "10:00",
      "10:30",
      "UTC",
      WEEKLY_SCHEDULE,
      [],
      30,
    );
    expect(result).toBe(false);
  });

  it("returns false for blocked day exception", () => {
    const result = isSlotValid(
      "2026-09-01",
      "14:00",
      "14:30",
      "UTC",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      BLOCKED_DAY_EXCEPTION,
      30,
    );
    expect(result).toBe(false);
  });
});

// =============================================================================
// getEffectiveHours
// =============================================================================

describe("getEffectiveHours", () => {
  it("returns working hours for a working day", () => {
    const result = getEffectiveHours(
      "2026-09-01",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      [],
    );
    expect(result).toEqual({ start: "09:00", end: "17:00" });
  });

  it("returns null for non-working day", () => {
    const result = getEffectiveHours(
      "2026-09-05",
      WEEKLY_SCHEDULE,
      [],
    );
    expect(result).toBeNull();
  });

  it("returns null for blocked day", () => {
    const result = getEffectiveHours(
      "2026-09-01",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      BLOCKED_DAY_EXCEPTION,
    );
    expect(result).toBeNull();
  });

  it("returns exception hours when available", () => {
    const result = getEffectiveHours(
      "2026-09-01",
      [
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
      ],
      HALF_DAY_EXCEPTION,
    );
    expect(result).toEqual({ start: "13:00", end: "17:00" });
  });
});
