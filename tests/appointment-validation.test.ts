import { describe, it, expect } from "vitest";

// =============================================================================
// Appointment Time Validation Tests
// These test the validation logic from src/app/api/appointments/route.ts
// Since the validation is inline in the route handler, we extract and test the
// same logic patterns here.
// =============================================================================

/**
 * Replicate the appointment time validation logic from the route handler.
 * This is the exact same check that was added in BUG-01 fix.
 */
function validateAppointmentTime(
  startTime: string,
): { valid: boolean; error?: string } {
  // Must match HH:mm format
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
    return { valid: false, error: "Time must be in HH:mm format" };
  }
  // BUG-01: Validate hour (00-23) and minute (00-59)
  const [hours, minutes] = startTime.split(":").map(Number);
  if (hours > 23 || minutes > 59) {
    return {
      valid: false,
      error: "Invalid time: hour must be 00-23 and minute must be 00-59",
    };
  }
  return { valid: true };
}

/**
 * Replicate the appointment reason validation logic from the route handler.
 * This is the exact same check that was added in BUG-02 fix.
 */
function validateAppointmentReason(
  reason: unknown,
): { valid: boolean; error?: string } {
  if (reason && typeof reason === "string" && reason.length > 500) {
    return {
      valid: false,
      error: "Reason must be 500 characters or less",
    };
  }
  return { valid: true };
}

// =============================================================================
// Priority 1: Appointment Validation — Time
// =============================================================================

describe("Appointment Time Validation (BUG-01)", () => {
  // Valid times
  it("accepts 00:00", () => {
    expect(validateAppointmentTime("00:00").valid).toBe(true);
  });

  it("accepts 09:30", () => {
    expect(validateAppointmentTime("09:30").valid).toBe(true);
  });

  it("accepts 17:45", () => {
    expect(validateAppointmentTime("17:45").valid).toBe(true);
  });

  it("accepts 23:59", () => {
    expect(validateAppointmentTime("23:59").valid).toBe(true);
  });

  it("accepts 12:00", () => {
    expect(validateAppointmentTime("12:00").valid).toBe(true);
  });

  // Invalid times — BUG-01 cases
  it("rejects 25:99 (hour > 23)", () => {
    const result = validateAppointmentTime("25:99");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("hour must be 00-23");
  });

  it("rejects 24:00 (hour = 24)", () => {
    const result = validateAppointmentTime("24:00");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("hour must be 00-23");
  });

  it("rejects 12:60 (minute = 60)", () => {
    const result = validateAppointmentTime("12:60");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("minute must be 00-59");
  });

  it("rejects 99:99 (both out of range)", () => {
    const result = validateAppointmentTime("99:99");
    expect(result.valid).toBe(false);
  });

  // Format validation
  it("rejects non-HH:mm format (no colon)", () => {
    expect(validateAppointmentTime("1230").valid).toBe(false);
  });

  it("rejects non-HH:mm format (3-digit hour)", () => {
    expect(validateAppointmentTime("1:30").valid).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateAppointmentTime("").valid).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(validateAppointmentTime("ab:cd").valid).toBe(false);
  });

  // Edge cases
  it("accepts 01:01", () => {
    expect(validateAppointmentTime("01:01").valid).toBe(true);
  });

  it("accepts 08:00", () => {
    expect(validateAppointmentTime("08:00").valid).toBe(true);
  });

  it("accepts 20:15", () => {
    expect(validateAppointmentTime("20:15").valid).toBe(true);
  });
});

// =============================================================================
// Priority 1: Appointment Validation — Reason Length (BUG-02)
// =============================================================================

describe("Appointment Reason Validation (BUG-02)", () => {
  it("accepts null/undefined reason", () => {
    expect(validateAppointmentReason(null).valid).toBe(true);
    expect(validateAppointmentReason(undefined).valid).toBe(true);
  });

  it("accepts empty string reason", () => {
    expect(validateAppointmentReason("").valid).toBe(true);
  });

  it("accepts short reason", () => {
    expect(validateAppointmentReason("Headache").valid).toBe(true);
  });

  it("accepts reason at exactly 500 characters", () => {
    expect(validateAppointmentReason("A".repeat(500)).valid).toBe(true);
  });

  it("rejects reason at 501 characters", () => {
    const result = validateAppointmentReason("A".repeat(501));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("500 characters");
  });

  it("rejects reason at 10000 characters", () => {
    const result = validateAppointmentReason("A".repeat(10000));
    expect(result.valid).toBe(false);
  });

  it("accepts non-string reason (number) — no crash", () => {
    // The route checks typeof === 'string' first
    expect(validateAppointmentReason(12345).valid).toBe(true);
  });
});

// =============================================================================
// Priority 2: Consultation Business Rules (Logic Tests)
// =============================================================================

describe("Consultation Business Rules", () => {
  // Simulate the consultation validation order from the fixed route handler
  type AppointmentStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED" | "PENDING" | "IN_PROGRESS" | "NO_SHOW";

  function validateConsultationRequest(
    appointmentStatus: AppointmentStatus,
    hasExistingConsultation: boolean,
    isDoctorOwner: boolean,
  ): { allowed: boolean; code?: string; httpStatus?: number } {
    // Step 1: Doctor ownership check
    if (!isDoctorOwner) {
      return { allowed: false, code: "FORBIDDEN", httpStatus: 403 };
    }

    // Step 2: Check if consultation already exists (BUG-07 fix — this fires FIRST)
    if (hasExistingConsultation) {
      return { allowed: false, code: "ALREADY_EXISTS", httpStatus: 409 };
    }

    // Step 3: Validate appointment status
    if (appointmentStatus !== "CONFIRMED") {
      return { allowed: false, code: "INVALID_STATUS", httpStatus: 422 };
    }

    return { allowed: true };
  }

  it("allows consultation on CONFIRMED appointment with no existing consultation", () => {
    const result = validateConsultationRequest("CONFIRMED", false, true);
    expect(result.allowed).toBe(true);
  });

  it("returns 409 ALREADY_EXISTS when consultation already exists", () => {
    const result = validateConsultationRequest("CONFIRMED", true, true);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("ALREADY_EXISTS");
    expect(result.httpStatus).toBe(409);
  });

  it("returns 403 FORBIDDEN when wrong doctor tries to create consultation", () => {
    const result = validateConsultationRequest("CONFIRMED", false, false);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("FORBIDDEN");
    expect(result.httpStatus).toBe(403);
  });

  it("returns 422 INVALID_STATUS for COMPLETED appointment without existing consultation", () => {
    const result = validateConsultationRequest("COMPLETED", false, true);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("INVALID_STATUS");
    expect(result.httpStatus).toBe(422);
  });

  it("returns 422 INVALID_STATUS for CANCELLED appointment", () => {
    const result = validateConsultationRequest("CANCELLED", false, true);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("INVALID_STATUS");
  });

  it("returns 422 INVALID_STATUS for PENDING appointment", () => {
    const result = validateConsultationRequest("PENDING", false, true);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("INVALID_STATUS");
  });

  it("returns 409 even if appointment is COMPLETED (duplicate check fires first)", () => {
    // BUG-07: The duplicate check must fire before the status check,
    // regardless of appointment status.
    const result = validateConsultationRequest("COMPLETED", true, true);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("ALREADY_EXISTS");
    expect(result.httpStatus).toBe(409);
  });

  it("only one consultation can exist per appointment", () => {
    // Simulate: first creates, second is blocked
    const first = validateConsultationRequest("CONFIRMED", false, true);
    expect(first.allowed).toBe(true);

    const second = validateConsultationRequest("CONFIRMED", true, true);
    expect(second.allowed).toBe(false);
    expect(second.code).toBe("ALREADY_EXISTS");
  });
});

// =============================================================================
// Priority 3: Fulfillment Business Rules (Logic Tests)
// =============================================================================

describe("Fulfillment Stock Deduction Logic", () => {
  interface FulfillmentItem {
    pharmacyMedicineId: string | null;
    fulfilled: boolean;
    quantity: number;
  }

  interface InventoryItem {
    id: string;
    stock: number;
  }

  /**
   * Simulate the fulfillment completion stock deduction logic.
   * This tests the same business rules as the PATCH status route handler.
   */
  function processFulfillmentCompletion(
    items: FulfillmentItem[],
    inventory: InventoryItem[],
  ): { success: boolean; error?: string; stockChanges?: { id: string; before: number; after: number }[] } {
    const stockChanges: { id: string; before: number; after: number }[] = [];

    for (const item of items) {
      if (!item.pharmacyMedicineId) continue;

      const inv = inventory.find((i) => i.id === item.pharmacyMedicineId);
      if (!inv) {
        return { success: false, error: `Inventory item ${item.pharmacyMedicineId} not found` };
      }

      if (inv.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.pharmacyMedicineId}: available ${inv.stock}, needed ${item.quantity}`,
        };
      }

      stockChanges.push({
        id: inv.id,
        before: inv.stock,
        after: inv.stock - item.quantity,
      });
    }

    return { success: true, stockChanges };
  }

  it("deducts stock correctly for linked inventory items", () => {
    const items: FulfillmentItem[] = [
      { pharmacyMedicineId: "inv-1", fulfilled: false, quantity: 2 },
      { pharmacyMedicineId: "inv-2", fulfilled: false, quantity: 1 },
    ];
    const inventory: InventoryItem[] = [
      { id: "inv-1", stock: 100 },
      { id: "inv-2", stock: 50 },
    ];

    const result = processFulfillmentCompletion(items, inventory);
    expect(result.success).toBe(true);
    expect(result.stockChanges).toHaveLength(2);
    expect(result.stockChanges![0]).toEqual({ id: "inv-1", before: 100, after: 98 });
    expect(result.stockChanges![1]).toEqual({ id: "inv-2", before: 50, after: 49 });
  });

  it("rejects when stock is insufficient", () => {
    const items: FulfillmentItem[] = [
      { pharmacyMedicineId: "inv-1", fulfilled: false, quantity: 200 },
    ];
    const inventory: InventoryItem[] = [
      { id: "inv-1", stock: 100 },
    ];

    const result = processFulfillmentCompletion(items, inventory);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient stock");
  });

  it("skips items without inventory linkage", () => {
    const items: FulfillmentItem[] = [
      { pharmacyMedicineId: null, fulfilled: false, quantity: 5 },
    ];
    const inventory: InventoryItem[] = [];

    const result = processFulfillmentCompletion(items, inventory);
    expect(result.success).toBe(true);
    expect(result.stockChanges).toHaveLength(0);
  });

  it("handles mixed linked and unlinked items", () => {
    const items: FulfillmentItem[] = [
      { pharmacyMedicineId: "inv-1", fulfilled: false, quantity: 3 },
      { pharmacyMedicineId: null, fulfilled: false, quantity: 1 },
    ];
    const inventory: InventoryItem[] = [
      { id: "inv-1", stock: 50 },
    ];

    const result = processFulfillmentCompletion(items, inventory);
    expect(result.success).toBe(true);
    expect(result.stockChanges).toHaveLength(1);
    expect(result.stockChanges![0]).toEqual({ id: "inv-1", before: 50, after: 47 });
  });

  it("never allows negative stock", () => {
    const items: FulfillmentItem[] = [
      { pharmacyMedicineId: "inv-1", fulfilled: false, quantity: 101 },
    ];
    const inventory: InventoryItem[] = [
      { id: "inv-1", stock: 100 },
    ];

    const result = processFulfillmentCompletion(items, inventory);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient stock");
  });

  it("correctly detects inventory item not found", () => {
    const items: FulfillmentItem[] = [
      { pharmacyMedicineId: "inv-nonexistent", fulfilled: false, quantity: 1 },
    ];
    const inventory: InventoryItem[] = [];

    const result = processFulfillmentCompletion(items, inventory);
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("deducts correctly with quantity = 1", () => {
    const items: FulfillmentItem[] = [
      { pharmacyMedicineId: "inv-1", fulfilled: false, quantity: 1 },
    ];
    const inventory: InventoryItem[] = [
      { id: "inv-1", stock: 1 },
    ];

    const result = processFulfillmentCompletion(items, inventory);
    expect(result.success).toBe(true);
    expect(result.stockChanges![0]).toEqual({ id: "inv-1", before: 1, after: 0 });
  });
});

// =============================================================================
// Priority 3: Fulfillment Status Transitions
// =============================================================================

describe("Fulfillment Status Transitions", () => {
  // Valid status transitions from the PATCH route handler
  const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ["ACCEPTED", "REJECTED"],
    ACCEPTED: ["PREPARING", "REJECTED"],
    PREPARING: ["READY", "REJECTED"],
    READY: ["COMPLETED", "REJECTED"],
    COMPLETED: [],
    REJECTED: [],
    CANCELLED: [],
  };

  function canTransition(from: string, to: string): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  it("allows PENDING → ACCEPTED", () => {
    expect(canTransition("PENDING", "ACCEPTED")).toBe(true);
  });

  it("allows ACCEPTED → PREPARING", () => {
    expect(canTransition("ACCEPTED", "PREPARING")).toBe(true);
  });

  it("allows PREPARING → READY", () => {
    expect(canTransition("PREPARING", "READY")).toBe(true);
  });

  it("allows READY → COMPLETED", () => {
    expect(canTransition("READY", "COMPLETED")).toBe(true);
  });

  it("allows PENDING → REJECTED", () => {
    expect(canTransition("PENDING", "REJECTED")).toBe(true);
  });

  it("allows ACCEPTED → REJECTED", () => {
    expect(canTransition("ACCEPTED", "REJECTED")).toBe(true);
  });

  it("rejects COMPLETED → any", () => {
    expect(canTransition("COMPLETED", "READY")).toBe(false);
    expect(canTransition("COMPLETED", "ACCEPTED")).toBe(false);
  });

  it("rejects REJECTED → any", () => {
    expect(canTransition("REJECTED", "READY")).toBe(false);
  });

  it("rejects PENDING → COMPLETED (must go through steps)", () => {
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
  });

  it("rejects PENDING → READY (must go through steps)", () => {
    expect(canTransition("PENDING", "READY")).toBe(false);
  });
});
