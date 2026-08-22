import { baseApi } from "./baseApi";
import type { ApiResponse } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface PatientProfile {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | null;
  address: string | null;
  avatar: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePatientProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  address?: string;
}

// =============================================================================
// Patient API
// =============================================================================

export const patientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatientProfile: builder.query<ApiResponse<PatientProfile>, void>({
      query: () => "/patient/profile",
      providesTags: ["Patient"],
    }),
    updatePatientProfile: builder.mutation<
      ApiResponse<PatientProfile>,
      UpdatePatientProfileRequest
    >({
      query: (data) => ({
        url: "/patient/profile",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Patient"],
    }),
  }),
});

export const { useGetPatientProfileQuery, useUpdatePatientProfileMutation } =
  patientApi;
