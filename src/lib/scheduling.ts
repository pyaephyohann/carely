/**
 * Scheduling utility for generating available appointment slots.
 *
 * Strategy:
 * 1. Look up the doctor's recurring weekly schedule for the target date's day-of-week.
 * 2. Check for availability exceptions on that date.
 * 3. Look up existing confirmed/pending appointments for that date.
 * 4. Generate time slots from the schedule, subtracting exceptions and booked slots.
 *
 * All times are handled in the doctor's local timezone. The API layer
 * converts between UTC and the doctor's timezone using Intl APIs.
 */

import { isAfter, format } from "date-fns";

// =============================================================================
// Types
// =============================================================================

export interface DoctorScheduleEntry {
  dayOfWeek: number; // 0=Sunday ... 6=Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  active: boolean;
}

export interface DoctorAvailabilityException {
  date: string;          // "YYYY-MM-DD"
  available: boolean;    // false = full day blocked
  startTime: string | null; // "09:00" — required if available=true
  endTime: string | null;   // "17:00" — required if available=true
}

export interface ExistingAppointment {
  startTime: string; // ISO string (UTC)
  endTime: string;   // ISO string (UTC)
}

export interface TimeSlot {
  startTime: string; // ISO string (UTC)
  endTime: string;   // ISO string (UTC)
  localStartTime: string; // "HH:mm" in doctor's timezone
  localEndTime: string;   // "HH:mm" in doctor's timezone
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Parse "HH:mm" time string into hours and minutes.
 */
function parseTimeString(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(":").map(Number);
  return { hours: h, minutes: m };
}

/**
 * Convert "HH:mm" local time to a Date object for a specific date in a timezone.
 * Uses Intl to get the UTC offset for the timezone on that date, then builds UTC.
 */
function localTimeToDate(dateStr: string, timeStr: string, timezone: string): Date {
  const { hours, minutes } = parseTimeString(timeStr);

  // Create a date string and use the timezone to determine the offset
  // We format a known date in the target timezone to get its offset
  const [year, month, day] = dateStr.split("-").map(Number);

  // Use Intl to find the UTC offset
  const dateAtMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(dateAtMidnight);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0");

  // The offset is: UTC time - local time at this moment
  const localAtMidnight = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offsetMs = dateAtMidnight.getTime() - localAtMidnight;

  // Now create the actual local time
  const localMs = Date.UTC(year, month - 1, day, hours, minutes, 0);
  return new Date(localMs + offsetMs);
}



// =============================================================================
// Slot Generation
// =============================================================================

/**
 * Generate available time slots for a doctor on a specific date.
 *
 * @param dateStr - Target date in "YYYY-MM-DD" format
 * @param doctorTimezone - IANA timezone string (e.g. "Asia/Ho_Chi_Minh")
 * @param schedule - Doctor's weekly recurring schedules
 * @param exceptions - Doctor's availability exceptions for the date
 * @param existingAppointments - Existing appointments for the date (in UTC)
 * @param durationMinutes - Appointment duration in minutes (default 30)
 * @param now - Current time (for filtering past slots)
 */
export function generateAvailableSlots(
  dateStr: string,
  doctorTimezone: string,
  schedule: DoctorScheduleEntry[],
  exceptions: DoctorAvailabilityException[],
  existingAppointments: ExistingAppointment[],
  durationMinutes: number = 30,
  now: Date = new Date(),
): TimeSlot[] {
  // Step 1: Get the day of week for the target date
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = dateObj.getUTCDay();

  // Step 2: Find the schedule entry for this day
  const daySchedule = schedule.find(
    (s) => s.dayOfWeek === dayOfWeek && s.active,
  );

  if (!daySchedule) {
    // Doctor doesn't work on this day
    return [];
  }

  // Step 3: Check for availability exceptions
  const exception = exceptions.find((e) => e.date === dateStr);

  if (exception && !exception.available) {
    // Full day blocked
    return [];
  }

  // Determine the effective working hours
  let effectiveStart: string;
  let effectiveEnd: string;

  if (exception && exception.available && exception.startTime && exception.endTime) {
    // Use exception hours (intersection with schedule)
    effectiveStart = exception.startTime > daySchedule.startTime ? exception.startTime : daySchedule.startTime;
    effectiveEnd = exception.endTime < daySchedule.endTime ? exception.endTime : daySchedule.endTime;
  } else {
    effectiveStart = daySchedule.startTime;
    effectiveEnd = daySchedule.endTime;
  }

  // Validate that start < end
  if (effectiveStart >= effectiveEnd) {
    return [];
  }

  // Step 4: Generate raw slots
  const { hours: startH, minutes: startM } = parseTimeString(effectiveStart);
  const { hours: endH, minutes: endM } = parseTimeString(effectiveEnd);

  const rawSlots: { startLocal: string; endLocal: string; startUTC: Date; endUTC: Date }[] = [];

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const slotStartH = Math.floor(currentMinutes / 60);
    const slotStartM = currentMinutes % 60;
    const slotEndMinutes = currentMinutes + durationMinutes;
    const slotEndH = Math.floor(slotEndMinutes / 60);
    const slotEndM = slotEndMinutes % 60;

    const startLocal = `${slotStartH.toString().padStart(2, "0")}:${slotStartM.toString().padStart(2, "0")}`;
    const endLocal = `${slotEndH.toString().padStart(2, "0")}:${slotEndM.toString().padStart(2, "0")}`;

    const startUTC = localTimeToDate(dateStr, startLocal, doctorTimezone);
    const endUTC = localTimeToDate(dateStr, endLocal, doctorTimezone);

    rawSlots.push({ startLocal, endLocal, startUTC, endUTC });
    currentMinutes += durationMinutes;
  }

  // Step 5: Filter out past slots
  const futureSlots = rawSlots.filter(
    (slot) => isAfter(slot.startUTC, now) || slot.startUTC.getTime() === now.getTime(),
  );

  // Step 6: Filter out slots that overlap with existing appointments
  const availableSlots: TimeSlot[] = [];

  for (const slot of futureSlots) {
    const hasConflict = existingAppointments.some((appt) => {
      const apptStart = new Date(appt.startTime);
      const apptEnd = new Date(appt.endTime);

      // Two time ranges overlap if: start1 < end2 AND start2 < end1
      return slot.startUTC.getTime() < apptEnd.getTime() && apptStart.getTime() < slot.endUTC.getTime();
    });

    if (!hasConflict) {
      availableSlots.push({
        startTime: slot.startUTC.toISOString(),
        endTime: slot.endUTC.toISOString(),
        localStartTime: slot.startLocal,
        localEndTime: slot.endLocal,
      });
    }
  }

  return availableSlots;
}

/**
 * Validate that a proposed slot falls within the doctor's working hours
 * and is not blocked by exceptions.
 */
export function isSlotValid(
  dateStr: string,
  localStartTime: string,
  localEndTime: string,
  doctorTimezone: string,
  schedule: DoctorScheduleEntry[],
  exceptions: DoctorAvailabilityException[],
  durationMinutes: number,
): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = dateObj.getUTCDay();

  const daySchedule = schedule.find((s) => s.dayOfWeek === dayOfWeek && s.active);
  if (!daySchedule) return false;

  // Check exceptions
  const exception = exceptions.find((e) => e.date === dateStr);
  if (exception && !exception.available) return false;

  let effectiveStart = daySchedule.startTime;
  let effectiveEnd = daySchedule.endTime;

  if (exception && exception.available && exception.startTime && exception.endTime) {
    effectiveStart = exception.startTime > daySchedule.startTime ? exception.startTime : daySchedule.startTime;
    effectiveEnd = exception.endTime < daySchedule.endTime ? exception.endTime : daySchedule.endTime;
  }

  // Slot must be within working hours
  if (localStartTime < effectiveStart || localEndTime > effectiveEnd) return false;

  // Slot must fit completely
  const { hours: sH, minutes: sM } = parseTimeString(localStartTime);
  const { hours: eH, minutes: eM } = parseTimeString(localEndTime);
  const slotMinutes = (eH * 60 + eM) - (sH * 60 + sM);
  if (slotMinutes !== durationMinutes) return false;

  // Check consecutive slots within same schedule block
  const startMinutes = sH * 60 + sM;
  if (startMinutes % durationMinutes !== 0 && startMinutes !== parseTimeString(effectiveStart).hours * 60 + parseTimeString(effectiveStart).minutes) {
    // Slot doesn't align with schedule start — check if it's on the boundary
    const effStartMinutes = parseTimeString(effectiveStart).hours * 60 + parseTimeString(effectiveStart).minutes;
    if ((startMinutes - effStartMinutes) % durationMinutes !== 0) return false;
  }

  return true;
}

/**
 * Get the doctor's effective working hours for a given date.
 * Returns null if the doctor doesn't work that day.
 */
export function getEffectiveHours(
  dateStr: string,
  schedule: DoctorScheduleEntry[],
  exceptions: DoctorAvailabilityException[],
): { start: string; end: string } | null {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = dateObj.getUTCDay();

  const daySchedule = schedule.find((s) => s.dayOfWeek === dayOfWeek && s.active);
  if (!daySchedule) return null;

  const exception = exceptions.find((e) => e.date === dateStr);
  if (exception && !exception.available) return null;

  let start = daySchedule.startTime;
  let end = daySchedule.endTime;

  if (exception && exception.available && exception.startTime && exception.endTime) {
    start = exception.startTime > daySchedule.startTime ? exception.startTime : daySchedule.startTime;
    end = exception.endTime < daySchedule.endTime ? exception.endTime : daySchedule.endTime;
  }

  if (start >= end) return null;

  return { start, end };
}

/**
 * Format a UTC ISO string to a local display string for the doctor's timezone.
 */
export function formatInTimezone(
  utcDateString: string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = new Date(utcDateString);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).format(date);
}

/**
 * Format a date string for display.
 */
export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return format(date, "EEEE, MMMM d, yyyy");
}
