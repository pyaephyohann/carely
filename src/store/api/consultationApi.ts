import { baseApi } from "./baseApi";
import type { ApiResponse, PaginationMeta } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface ConsultationDoctor {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  specialization: string | null;
  phone: string | null;
}

export interface ConsultationPatient {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  email?: string;
}

export interface PrescriptionItemData {
  id: string;
  medicineId: string;
  medicineName: string;
  medicineGenericName: string | null;
  medicineCategory?: string;
  medicineDescription?: string;
  dosageForms?: string[];
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
}

export interface PrescriptionData {
  id: string;
  consultationId: string;
  diagnosis: string;
  notes: string | null;
  status: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt?: string;
  doctor?: ConsultationDoctor;
  patient?: ConsultationPatient;
  appointmentDate?: string;
  itemCount?: number;
  items: PrescriptionItemData[];
  consultation?: {
    id: string;
    diagnosis: string;
    symptoms?: string | null;
    notes?: string | null;
    followUpDate?: string | null;
    appointment?: {
      id: string;
      startTime: string;
      type: string;
    } | null;
  } | null;
}

export interface ConsultationData {
  id: string;
  appointmentId: string;
  diagnosis: string;
  symptoms: string | null;
  notes: string | null;
  followUpDate: string | null;
  createdAt: string;
  updatedAt?: string;
  appointment?: {
    id: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
  };
  patient?: ConsultationPatient;
  prescriptions?: PrescriptionData[];
}

export interface MedicalRecordData {
  id: string;
  type: string;
  title: string;
  description: string | null;
  treatmentPlan: string | null;
  attachments: string[];
  createdAt: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  } | null;
  consultation: {
    id: string;
    diagnosis: string;
  } | null;
}

export interface CreateConsultationRequest {
  appointmentId: string;
  diagnosis: string;
  symptoms?: string;
  notes?: string;
  followUpDate?: string;
  prescription?: {
    diagnosis: string;
    notes?: string;
    validUntil?: string;
    items: {
      medicineId: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }[];
  };
}

export interface UpdateConsultationRequest {
  diagnosis?: string;
  symptoms?: string;
  notes?: string;
  followUpDate?: string;
}

export interface CreatePrescriptionRequest {
  consultationId: string;
  diagnosis: string;
  notes?: string;
  validUntil?: string;
  items: {
    medicineId: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
}

export interface UpdatePrescriptionRequest {
  diagnosis?: string;
  notes?: string;
  validUntil?: string;
  items?: {
    medicineId: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
}

// =============================================================================
// Consultation API
// =============================================================================

export const consultationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Doctor: Create consultation ---
    createConsultation: builder.mutation<
      ApiResponse<{ consultation: ConsultationData; prescription: PrescriptionData | null }>,
      CreateConsultationRequest
    >({
      query: (data) => ({
        url: "/doctor/consultations",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Appointment", "Patient"],
    }),

    // --- Doctor: Get consultation detail ---
    getDoctorConsultation: builder.query<ApiResponse<ConsultationData>, string>({
      query: (consultationId) => `/doctor/consultations/${consultationId}`,
      providesTags: (_result, _error, id) => [{ type: "Patient", id: `consultation-${id}` }],
    }),

    // --- Doctor: Update consultation ---
    updateConsultation: builder.mutation<
      ApiResponse<ConsultationData>,
      { consultationId: string } & UpdateConsultationRequest
    >({
      query: ({ consultationId, ...body }) => ({
        url: `/doctor/consultations/${consultationId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { consultationId }) => [
        { type: "Patient", id: `consultation-${consultationId}` },
      ],
    }),

    // --- Doctor: Create prescription ---
    createPrescription: builder.mutation<
      ApiResponse<PrescriptionData>,
      CreatePrescriptionRequest
    >({
      query: (data) => ({
        url: "/doctor/prescriptions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Patient", "Prescription"],
    }),

    // --- Doctor: List prescriptions ---
    getDoctorPrescriptions: builder.query<
      { data: PrescriptionData[]; meta: PaginationMeta },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.status) sp.set("status", params.status);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/doctor/prescriptions${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Prescription"],
    }),

    // --- Doctor: Get prescription detail ---
    getDoctorPrescription: builder.query<ApiResponse<PrescriptionData>, string>({
      query: (prescriptionId) => `/doctor/prescriptions/${prescriptionId}`,
      providesTags: (_result, _error, id) => [{ type: "Prescription", id }],
    }),

    // --- Doctor: Update prescription ---
    updatePrescription: builder.mutation<
      ApiResponse<PrescriptionData>,
      { prescriptionId: string } & UpdatePrescriptionRequest
    >({
      query: ({ prescriptionId, ...body }) => ({
        url: `/doctor/prescriptions/${prescriptionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { prescriptionId }) => [
        { type: "Prescription", id: prescriptionId },
        "Patient",
      ],
    }),

    // --- Patient: Medical records ---
    getPatientMedicalRecords: builder.query<
      { data: MedicalRecordData[]; meta: PaginationMeta },
      { page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/patient/medical-records${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Patient"],
    }),

    // --- Patient: Prescriptions ---
    getPatientPrescriptions: builder.query<
      { data: PrescriptionData[]; meta: PaginationMeta },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.status) sp.set("status", params.status);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/patient/prescriptions${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Prescription"],
    }),

    // --- Patient: Prescription detail ---
    getPatientPrescription: builder.query<ApiResponse<PrescriptionData>, string>({
      query: (prescriptionId) => `/patient/prescriptions/${prescriptionId}`,
      providesTags: (_result, _error, id) => [{ type: "Prescription", id }],
    }),
  }),
});

export const {
  useCreateConsultationMutation,
  useGetDoctorConsultationQuery,
  useUpdateConsultationMutation,
  useCreatePrescriptionMutation,
  useGetDoctorPrescriptionsQuery,
  useGetDoctorPrescriptionQuery,
  useUpdatePrescriptionMutation,
  useGetPatientMedicalRecordsQuery,
  useGetPatientPrescriptionsQuery,
  useGetPatientPrescriptionQuery,
} = consultationApi;
