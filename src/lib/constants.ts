// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const API_TIMEOUT = 30000; // 30 seconds

// Auth Constants (managed via HttpOnly cookies, not client-side storage)
// Token names: carely_access_token, carely_refresh_token

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Appointment
export const APPOINTMENT_DURATIONS = [15, 30, 45, 60]; // in minutes
export const DEFAULT_APPOINTMENT_DURATION = 30;

// Days of Week
export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

// Navigation Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  PATIENT: {
    DASHBOARD: "/patient/dashboard",
    PROFILE: "/patient/profile",
    DOCTORS: "/patient/doctors",
    APPOINTMENTS: "/patient/appointments",
    PRESCRIPTIONS: "/patient/prescriptions",
    RECORDS: "/patient/records",
  },
  DOCTOR: {
    DASHBOARD: "/doctor/dashboard",
    PROFILE: "/doctor/profile",
    PATIENTS: "/doctor/patients",
    APPOINTMENTS: "/doctor/appointments",
    CONSULTATIONS: "/doctor/consultations",
    PRESCRIPTIONS: "/doctor/prescriptions",
  },
  PHARMACY: {
    DASHBOARD: "/pharmacy/dashboard",
    INVENTORY: "/pharmacy/inventory",
    PRESCRIPTIONS: "/pharmacy/prescriptions",
    PROFILE: "/pharmacy/profile",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    DOCTORS: "/admin/doctors",
    PHARMACIES: "/admin/pharmacies",
    APPOINTMENTS: "/admin/appointments",
    FULFILLMENTS: "/admin/fulfillments",
    MEDICINES: "/admin/medicines",
    SETTINGS: "/admin/settings",
  },
} as const;

// Specializations (common medical specializations)
export const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Practice",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Urology",
] as const;

// Status Colors
export const STATUS_COLORS = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-green-100 text-green-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
} as const;
