import { baseApi } from "./baseApi";
import type { ApiResponse, Specialization, PaginationMeta } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface DoctorListItem {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  bio: string | null;
  consultationFee: number;
  yearsExperience: number | null;
  verified: boolean;
  rating: number | null;
  totalReviews: number;
  specialization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  scheduleSummary: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
}

export interface DoctorDetail extends DoctorListItem {
  verifiedAt: string | null;
  createdAt: string;
  schedules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    patientName: string;
  }[];
}

export interface DoctorListResponse {
  data: DoctorListItem[];
  meta: PaginationMeta;
}

export interface DoctorSearchParams {
  search?: string;
  specialization?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

// =============================================================================
// Doctor API
// =============================================================================

export const doctorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDoctors: builder.query<DoctorListResponse, DoctorSearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.set("search", params.search);
        if (params.specialization) searchParams.set("specialization", params.specialization);
        if (params.page) searchParams.set("page", params.page.toString());
        if (params.limit) searchParams.set("limit", params.limit.toString());
        if (params.sortBy) searchParams.set("sortBy", params.sortBy);
        if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
        const qs = searchParams.toString();
        return `/doctors${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Doctor"],
    }),
    getDoctorById: builder.query<ApiResponse<DoctorDetail>, string>({
      query: (doctorId) => `/doctors/${doctorId}`,
      providesTags: (_result, _error, doctorId) => [
        { type: "Doctor", id: doctorId },
      ],
    }),
    getSpecializations: builder.query<ApiResponse<Specialization[]>, void>({
      query: () => "/specializations",
    }),
  }),
});

export const {
  useGetDoctorsQuery,
  useGetDoctorByIdQuery,
  useGetSpecializationsQuery,
} = doctorApi;
