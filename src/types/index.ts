// User & Auth Types
export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  profile?: Record<string, unknown> | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Profile Types
export interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  avatar?: string;
  user: User;
}

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export interface Doctor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  specialization: string;
  licenseNumber: string;
  bio?: string;
  consultationFee: number;
  yearsExperience?: number;
  verified: boolean;
  rating?: number;
  totalReviews: number;
  user: User;
}

export interface Admin {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  user: User;
}

// Appointment Types
export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export type AppointmentType = "CONSULTATION" | "FOLLOW_UP" | "EMERGENCY" | "VIRTUAL";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  type: AppointmentType;
  reason?: string;
  notes?: string;
  cancelReason?: string;
  patient?: Patient;
  doctor?: Doctor;
  createdAt: string;
  updatedAt: string;
}

// Time Slot Types
export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

// Working Hours
export interface WorkingHour {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

// Consultation Types
export interface Consultation {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  diagnosis?: string;
  symptoms?: string;
  notes?: string;
  followUpDate?: string;
  appointment?: Appointment;
  doctor?: Doctor;
  patient?: Patient;
  createdAt: string;
}

// Prescription Types
export type PrescriptionStatus = "DRAFT" | "ACTIVE" | "FINALIZED" | "COMPLETED" | "CANCELLED";

export interface Prescription {
  id: string;
  consultationId: string;
  doctorId: string;
  patientId: string;
  diagnosis: string;
  notes?: string;
  status: PrescriptionStatus;
  validUntil?: string;
  items: PrescriptionItem[];
  doctor?: Doctor;
  patient?: Patient;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineId: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  medicine?: Medicine;
}

// Medicine Types
export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer?: string;
  description?: string;
  dosageForms: string[];
  sideEffects?: string;
  contraindications?: string;
  requiresPrescription: boolean;
}

// Medical Record Types
export type RecordType = "LAB_RESULT" | "IMAGING" | "PRESCRIPTION" | "REFERRAL" | "OTHER";

export interface MedicalRecord {
  id: string;
  patientId: string;
  consultationId?: string;
  type: RecordType;
  title: string;
  description?: string;
  attachments: string[];
  createdAt: string;
}

// Review Types
export interface Review {
  id: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment?: string;
  patient?: Patient;
  createdAt: string;
}

// Notification Types
export type NotificationType =
  | "APPOINTMENT_REMINDER"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_CONFIRMED"
  | "PRESCRIPTION_READY"
  | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Specialization
export interface Specialization {
  id: string;
  name: string;
  slug: string;
}

// Search & Filter Types
export interface DoctorSearchParams {
  query?: string;
  specialization?: string;
  minFee?: number;
  maxFee?: number;
  available?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "rating" | "fee" | "experience";
  sortOrder?: "asc" | "desc";
}

export interface AppointmentSearchParams {
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
