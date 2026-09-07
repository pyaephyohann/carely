import { baseApi } from "./baseApi";
import type { PaginationMeta } from "@/types";

export interface DoctorPatientListItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  email: string;
  avatar: string | null;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  appointmentCount: number;
  prescriptionCount: number;
  lastAppointment: {
    id: string;
    startTime: string;
    status: string;
  } | null;
  nextAppointment: {
    id: string;
    startTime: string;
    status: string;
  } | null;
}

export interface DoctorPatientAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  followUpDate: string | null;
  consultationId: string | null;
}

export interface DoctorPatientDetail {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string | null;
    email: string;
    avatar: string | null;
    address: string | null;
    dateOfBirth: string | null;
    age: number | null;
    gender: string | null;
    genderLabel: string | null;
    memberSince: string;
  };
  stats: {
    appointmentCount: number;
    prescriptionCount: number;
    consultationCount: number;
  };
  prescriptionAppointmentId: string | null;
  appointments: {
    upcoming: DoctorPatientAppointment[];
    past: DoctorPatientAppointment[];
    all: DoctorPatientAppointment[];
  };
  prescriptions: {
    id: string;
    consultationId: string;
    diagnosis: string;
    notes: string | null;
    status: string;
    validUntil: string | null;
    createdAt: string;
    itemCount: number;
  }[];
  consultations: {
    id: string;
    appointmentId: string;
    diagnosis: string | null;
    symptoms: string | null;
    notes: string | null;
    followUpDate: string | null;
    createdAt: string;
  }[];
  medicalRecords: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    treatmentPlan: string | null;
    consultationId: string | null;
    createdAt: string;
  }[];
}

export const doctorPatientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDoctorPatients: builder.query<
      { data: DoctorPatientListItem[]; meta: PaginationMeta },
      { q?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.q) sp.set("q", params.q);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/doctor/patients${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Patient"],
    }),

    getDoctorPatientDetail: builder.query<
      { data: DoctorPatientDetail },
      string
    >({
      query: (patientId) => `/doctor/patients/${patientId}`,
      providesTags: (_result, _error, patientId) => [
        { type: "Patient", id: patientId },
      ],
    }),
  }),
});

export const {
  useGetDoctorPatientsQuery,
  useGetDoctorPatientDetailQuery,
} = doctorPatientApi;
