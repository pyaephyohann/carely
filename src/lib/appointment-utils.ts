/**
 * Appointment status transition rules and validation.
 *
 * Allowed transitions:
 *   PENDING   → CONFIRMED, CANCELLED
 *   CONFIRMED → COMPLETED, CANCELLED, NO_SHOW
 *
 * Invalid transitions are rejected server-side.
 */



// =============================================================================
// Status Transition Rules
// =============================================================================

type AppointmentStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const VALID_TRANSITIONS: Record<string, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
};

/**
 * Check if a status transition is allowed.
 */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to as AppointmentStatus);
}

/**
 * Get valid transitions for a given status.
 */
export function getValidTransitions(status: string): AppointmentStatus[] {
  return VALID_TRANSITIONS[status] || [];
}

/**
 * Get a human-readable label for an appointment status.
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    NO_SHOW: "No Show",
  };
  return labels[status] || status;
}

/**
 * Get a badge variant for an appointment status.
 */
export function getStatusVariant(status: string): "default" | "primary" | "success" | "warning" | "error" | "info" {
  const variants: Record<string, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
    PENDING: "warning",
    CONFIRMED: "primary",
    IN_PROGRESS: "info",
    COMPLETED: "success",
    CANCELLED: "error",
    NO_SHOW: "warning",
  };
  return variants[status] || "default";
}

// =============================================================================
// Appointment Validation
// =============================================================================

interface ValidateBookingParams {
  doctorExists: boolean;
  doctorActive: boolean;
  patientExists: boolean;
  patientActive: boolean;
  slotValid: boolean;
  slotInFuture: boolean;
  noConflict: boolean;
  slotAvailable: boolean;
}

/**
 * Validate a booking request and return an error message if invalid.
 */
export function validateBooking(params: ValidateBookingParams): string | null {
  if (!params.doctorExists) return "Doctor not found.";
  if (!params.doctorActive) return "This doctor is not currently accepting appointments.";
  if (!params.patientExists) return "Patient profile not found.";
  if (!params.patientActive) return "Your account is not active.";
  if (!params.slotValid) return "The selected time slot is not valid.";
  if (!params.slotInFuture) return "Cannot book appointments in the past.";
  if (!params.slotAvailable) return "This appointment time is no longer available. Please choose another time.";
  if (!params.noConflict) return "This time slot has already been booked. Please choose another time.";
  return null;
}

// =============================================================================
// Appointment Duration Helpers
// =============================================================================

/**
 * Calculate appointment duration in minutes from start and end times.
 */
export function getDurationMinutes(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Format duration for display.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// =============================================================================
// Date Helpers
// =============================================================================

/**
 * Get "YYYY-MM-DD" string for a Date object.
 */
export function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get "YYYY-MM-DD" string for today.
 */
export function getTodayStr(): string {
  return toDateStr(new Date());
}

/**
 * Get "YYYY-MM-DD" for N days from today.
 */
export function getFutureDateStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/**
 * Generate an array of "YYYY-MM-DD" strings for the next N days.
 */
export function getNextNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => getFutureDateStr(i));
}
