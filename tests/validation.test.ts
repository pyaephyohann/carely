import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  consultationSchema,
  createFulfillmentSchema,
  updateFulfillmentStatusSchema,
  inventoryItemSchema,
  stockAdjustmentSchema,
} from "@/lib/validation";

// =============================================================================
// Priority 4: Authentication / Input Validation
// =============================================================================

describe("Login Schema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@test.com",
      password: "Test1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Test1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "Test1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@test.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("Register Schema", () => {
  const validRegister = {
    firstName: "John",
    lastName: "Doe",
    email: "john@test.com",
    password: "Test1234",
    confirmPassword: "Test1234",
    role: "PATIENT" as const,
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validRegister);
    expect(result.success).toBe(true);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: "test1234",
      confirmPassword: "test1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: "TEST1234",
      confirmPassword: "TEST1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: "TestTest",
      confirmPassword: "TestTest",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password (< 8 chars)", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: "Test1",
      confirmPassword: "Test1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: "Test1234",
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });

  it("accepts DOCTOR role", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      role: "DOCTOR",
    });
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// Priority 1: Consultation Schema
// =============================================================================

describe("Consultation Schema", () => {
  const validConsultation = {
    appointmentId: "clx1234567890",
    diagnosis: "Common cold",
  };

  it("accepts valid consultation data", () => {
    const result = consultationSchema.safeParse(validConsultation);
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = consultationSchema.safeParse({
      ...validConsultation,
      symptoms: "Runny nose, sore throat",
      notes: "Follow up in 2 weeks",
      followUpDate: "2026-09-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty appointmentId", () => {
    const result = consultationSchema.safeParse({
      ...validConsultation,
      appointmentId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty diagnosis", () => {
    const result = consultationSchema.safeParse({
      ...validConsultation,
      diagnosis: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects diagnosis exceeding 2000 chars", () => {
    const result = consultationSchema.safeParse({
      ...validConsultation,
      diagnosis: "A".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts diagnosis at exactly 2000 chars", () => {
    const result = consultationSchema.safeParse({
      ...validConsultation,
      diagnosis: "A".repeat(2000),
    });
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// Fulfillment Schema
// =============================================================================

describe("Create Fulfillment Schema", () => {
  it("accepts valid prescription and pharmacy IDs", () => {
    const result = createFulfillmentSchema.safeParse({
      prescriptionId: "clx123",
      pharmacyId: "clx456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing prescriptionId", () => {
    const result = createFulfillmentSchema.safeParse({
      pharmacyId: "clx456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing pharmacyId", () => {
    const result = createFulfillmentSchema.safeParse({
      prescriptionId: "clx123",
    });
    expect(result.success).toBe(false);
  });
});

describe("Update Fulfillment Status Schema", () => {
  it("accepts valid status transitions", () => {
    for (const status of ["ACCEPTED", "PREPARING", "READY", "COMPLETED", "REJECTED", "CANCELLED"]) {
      const result = updateFulfillmentStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = updateFulfillmentStatusSchema.safeParse({
      status: "PENDING",
    });
    expect(result.success).toBe(false);
  });

  it("accepts rejectReason with REJECTED status", () => {
    const result = updateFulfillmentStatusSchema.safeParse({
      status: "REJECTED",
      rejectReason: "Out of stock",
    });
    expect(result.success).toBe(true);
  });

  it("rejects rejectReason exceeding 500 chars", () => {
    const result = updateFulfillmentStatusSchema.safeParse({
      status: "REJECTED",
      rejectReason: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Inventory Schema
// =============================================================================

describe("Inventory Item Schema", () => {
  it("accepts valid inventory item", () => {
    const result = inventoryItemSchema.safeParse({
      medicineId: "clx123",
      stock: 100,
      price: 25.99,
    });
    expect(result.success).toBe(true);
  });

  it("accepts zero stock", () => {
    const result = inventoryItemSchema.safeParse({
      medicineId: "clx123",
      stock: 0,
      price: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative stock", () => {
    const result = inventoryItemSchema.safeParse({
      medicineId: "clx123",
      stock: -1,
      price: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = inventoryItemSchema.safeParse({
      medicineId: "clx123",
      stock: 10,
      price: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("Stock Adjustment Schema", () => {
  it("accepts valid PURCHASE adjustment", () => {
    const result = stockAdjustmentSchema.safeParse({
      quantity: 50,
      type: "PURCHASE",
      reason: "Restocked from supplier",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid RETURN adjustment", () => {
    const result = stockAdjustmentSchema.safeParse({
      quantity: 5,
      type: "RETURN",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid ADJUSTMENT type", () => {
    const result = stockAdjustmentSchema.safeParse({
      quantity: 100,
      type: "ADJUSTMENT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = stockAdjustmentSchema.safeParse({
      quantity: 10,
      type: "SALE",
    });
    expect(result.success).toBe(false);
  });
});
