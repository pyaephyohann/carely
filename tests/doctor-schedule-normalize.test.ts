import { describe, expect, it } from "vitest";
import { normalizeWeeklySchedule } from "@/lib/doctor-schedule";

describe("normalizeWeeklySchedule", () => {
  it("returns a full 7-day default week for empty API data", () => {
    const week = normalizeWeeklySchedule([]);
    expect(week).toHaveLength(7);
    expect(week.every((d, i) => d.dayOfWeek === i)).toBe(true);
    expect(week.every((d) => d.active === false)).toBe(true);
    // Must never leave holes — UI indexes daySchedule.active for each day
    expect(week[0].active).toBe(false);
  });

  it("returns defaults for null/undefined", () => {
    expect(normalizeWeeklySchedule(null)).toHaveLength(7);
    expect(normalizeWeeklySchedule(undefined)).toHaveLength(7);
  });

  it("fills missing days when API returns a partial week", () => {
    const week = normalizeWeeklySchedule([
      { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", active: true },
      { dayOfWeek: 3, startTime: "13:00", endTime: "17:00", active: true },
    ]);
    expect(week).toHaveLength(7);
    expect(week[1]).toEqual({
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "12:00",
      active: true,
    });
    expect(week[3].active).toBe(true);
    expect(week[0].active).toBe(false);
    expect(week[2].active).toBe(false);
  });
});
