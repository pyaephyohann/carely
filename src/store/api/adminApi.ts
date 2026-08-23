import { baseApi } from "./baseApi";
import type { ApiResponse, PaginationMeta } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface AdminMetrics {
  totalPatients: number;
  totalDoctors: number;
  totalPharmacies: number;
  pendingDoctors: number;
  pendingPharmacies: number;
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  totalPrescriptions: number;
  activePrescriptions: number;
  pendingFulfillments: number;
  completedFulfillments: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  role: string;
  status: string;
  name: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  profile: {
    type: "PATIENT" | "DOCTOR" | "ADMIN" | "PHARMACY";
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    verified?: boolean;
    specialization?: { name: string } | null;
    pharmacy?: { id: string; name: string } | null;
  } | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  updatedAt: string;
  patient?: Record<string, unknown> | null;
  doctor?: Record<string, unknown> | null;
  admin?: Record<string, unknown> | null;
  pharmacyStaff?: Record<string, unknown> | null;
}

export interface AdminDoctorListItem {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  email: string;
  userStatus: string;
  licenseNumber: string;
  bio: string | null;
  consultationFee: number;
  yearsExperience: number | null;
  verified: boolean;
  verifiedAt: string | null;
  rating: number | null;
  totalReviews: number;
  specialization: string | null;
  createdAt: string;
  counts: { appointments: number; consultations: number };
}

export interface AdminDoctorDetail extends Omit<AdminDoctorListItem, "counts"> {
  appointmentDuration: number;
  timezone: string;
  updatedAt: string;
  userCreatedAt: string;
  specialization: string | null;
  specializationDetail: { id: string; name: string } | null;
  schedules: { dayOfWeek: number; startTime: string; endTime: string; active: boolean }[];
  counts: { appointments: number; consultations: number; prescriptions: number; reviews: number };
}

export interface AdminPharmacyListItem {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  licenseNumber: string;
  verified: boolean;
  verifiedAt: string | null;
  active: boolean;
  createdAt: string;
  counts: { staff: number; medicines: number; fulfillments: number };
}

export interface AdminPharmacyDetail extends AdminPharmacyListItem {
  latitude: number | null;
  longitude: number | null;
  openingHours: Record<string, unknown> | null;
  updatedAt: string;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: string;
    email: string;
    userStatus: string;
  }[];
}

export interface AdminAppointmentListItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason: string | null;
  createdAt: string;
  patient: { id: string; name: string; email: string };
  doctor: { id: string; name: string; specialization: string | null };
  hasConsultation: boolean;
}

export interface AdminFulfillmentListItem {
  id: string;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  pharmacy: { id: string; name: string; address: string } | null;
  patient: { id: string; name: string; email: string };
  prescription: { id: string; status: string; createdAt: string; itemCount: number } | null;
  itemCount: number;
  fulfilledCount: number;
}

// =============================================================================
// Admin API
// =============================================================================

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Dashboard ---
    getAdminDashboard: builder.query<
      ApiResponse<{
        metrics: AdminMetrics;
        recentUsers: { id: string; email: string; role: string; status: string; createdAt: string; name: string }[];
        pendingVerifications: {
          id: string;
          firstName: string;
          lastName: string;
          licenseNumber: string;
          specialization: string | null;
          createdAt: string;
        }[];
      }>,
      void
    >({
      query: () => "/admin/dashboard",
      providesTags: ["Admin"],
    }),

    // --- Users ---
    getAdminUsers: builder.query<
      { data: AdminUserListItem[]; meta: PaginationMeta },
      { search?: string; role?: string; status?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.search) sp.set("search", params.search);
        if (params.role) sp.set("role", params.role);
        if (params.status) sp.set("status", params.status);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/admin/users${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Admin"],
    }),

    getAdminUser: builder.query<ApiResponse<AdminUserDetail>, string>({
      query: (userId) => `/admin/users/${userId}`,
      providesTags: (_result, _error, id) => [{ type: "Admin", id: `user-${id}` }],
    }),

    updateUserStatus: builder.mutation<
      ApiResponse<{ id: string; email: string; role: string; status: string; updatedAt: string }>,
      { userId: string; status: string }
    >({
      query: ({ userId, status }) => ({
        url: `/admin/users/${userId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Admin"],
    }),

    // --- Doctors ---
    getAdminDoctors: builder.query<
      { data: AdminDoctorListItem[]; meta: PaginationMeta },
      { search?: string; verified?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.search) sp.set("search", params.search);
        if (params.verified) sp.set("verified", params.verified);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/admin/doctors${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Admin"],
    }),

    getAdminDoctor: builder.query<ApiResponse<AdminDoctorDetail>, string>({
      query: (doctorId) => `/admin/doctors/${doctorId}`,
      providesTags: (_result, _error, id) => [{ type: "Admin", id: `doctor-${id}` }],
    }),

    updateDoctorVerification: builder.mutation<
      ApiResponse<{ id: string; verified: boolean; verifiedAt: string | null }>,
      { doctorId: string; verified: boolean }
    >({
      query: ({ doctorId, verified }) => ({
        url: `/admin/doctors/${doctorId}/verification`,
        method: "PATCH",
        body: { verified },
      }),
      invalidatesTags: ["Admin"],
    }),

    // --- Pharmacies ---
    getAdminPharmacies: builder.query<
      { data: AdminPharmacyListItem[]; meta: PaginationMeta },
      { search?: string; verified?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.search) sp.set("search", params.search);
        if (params.verified) sp.set("verified", params.verified);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/admin/pharmacies${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Admin"],
    }),

    getAdminPharmacy: builder.query<ApiResponse<AdminPharmacyDetail>, string>({
      query: (pharmacyId) => `/admin/pharmacies/${pharmacyId}`,
      providesTags: (_result, _error, id) => [{ type: "Admin", id: `pharmacy-${id}` }],
    }),

    updatePharmacyVerification: builder.mutation<
      ApiResponse<{ id: string; name: string; verified: boolean; verifiedAt: string | null; active: boolean }>,
      { pharmacyId: string; verified?: boolean; active?: boolean }
    >({
      query: ({ pharmacyId, ...body }) => ({
        url: `/admin/pharmacies/${pharmacyId}/verification`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Admin"],
    }),

    // --- Appointments ---
    getAdminAppointments: builder.query<
      { data: AdminAppointmentListItem[]; meta: PaginationMeta },
      { status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.status) sp.set("status", params.status);
        if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
        if (params.dateTo) sp.set("dateTo", params.dateTo);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/admin/appointments${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Admin"],
    }),

    // --- Fulfillments ---
    getAdminFulfillments: builder.query<
      { data: AdminFulfillmentListItem[]; meta: PaginationMeta },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.status) sp.set("status", params.status);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/admin/fulfillments${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Admin"],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useUpdateUserStatusMutation,
  useGetAdminDoctorsQuery,
  useGetAdminDoctorQuery,
  useUpdateDoctorVerificationMutation,
  useGetAdminPharmaciesQuery,
  useGetAdminPharmacyQuery,
  useUpdatePharmacyVerificationMutation,
  useGetAdminAppointmentsQuery,
  useGetAdminFulfillmentsQuery,
} = adminApi;
