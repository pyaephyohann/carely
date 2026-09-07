export interface WeeklyScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export function buildDefaultWeeklySchedule(): WeeklyScheduleEntry[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    startTime: "09:00",
    endTime: "17:00",
    active: false,
  }));
}

/**
 * Normalize API rows into a full Sun–Sat week.
 * Empty or partial responses must not leave undefined days — the Schedule UI
 * indexes by dayOfWeek 0..6 and crashes on `daySchedule.active` otherwise.
 */
export function normalizeWeeklySchedule(
  rows: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    active: boolean;
  }> | null | undefined,
): WeeklyScheduleEntry[] {
  if (!rows || rows.length === 0) {
    return buildDefaultWeeklySchedule();
  }

  const byDay = new Map(
    rows
      .filter((s) => typeof s.dayOfWeek === "number" && s.dayOfWeek >= 0 && s.dayOfWeek <= 6)
      .map((s) => [
        s.dayOfWeek,
        {
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          active: s.active,
        } satisfies WeeklyScheduleEntry,
      ]),
  );

  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    return (
      byDay.get(dayOfWeek) ?? {
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        active: false,
      }
    );
  });
}
