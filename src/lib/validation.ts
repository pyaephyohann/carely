import { z } from "zod";

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    role: z.enum(["PATIENT", "DOCTOR"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Profile Schemas
export const patientProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  address: z.string().optional(),
});

export const doctorProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
  specialization: z.string().min(1, "Specialization is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  consultationFee: z.number().min(0, "Fee must be positive"),
  yearsExperience: z.number().min(0).max(60).optional(),
});

// Appointment Schemas
export const appointmentSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Time is required"),
  duration: z.number().min(15, "Minimum duration is 15 minutes"),
  type: z.enum(["CONSULTATION", "FOLLOW_UP", "EMERGENCY", "VIRTUAL"]),
  reason: z.string().max(500, "Reason must be 500 characters or less").optional(),
});

// Prescription Schemas
export const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1, "Medicine is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  instructions: z.string().optional(),
});

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  consultationId: z.string().min(1, "Consultation is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, "At least one item is required"),
});

// Search Schemas
export const doctorSearchSchema = z.object({
  query: z.string().optional(),
  specialization: z.string().optional(),
  minFee: z.number().min(0).optional(),
  maxFee: z.number().min(0).optional(),
  available: z.boolean().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.enum(["rating", "fee", "experience"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Types derived from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PatientProfileInput = z.infer<typeof patientProfileSchema>;
export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
export type DoctorSearchInput = z.infer<typeof doctorSearchSchema>;
