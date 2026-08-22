import { baseApi } from "./baseApi";
import type { ApiResponse, PaginationMeta } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  localStartTime: string;
  localEndTime: string;
}

export interface AvailabilityResponse {
  date: string;
  timezone: string;
  appointmentDuration: number;
  slots: AvailableSlot[];
}

export interface AppointmentDoctor {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  specialization: string | null;
  phone?: string;
  consultationFee?: number;
  timezone?: string;
}

export interface AppointmentPatient {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  email?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
}

export interface AppointmentListItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason: string | null;
  notes?: string | null;
  cancelReason: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  createdAt: string;
  doctor: AppointmentDoctor;
  patient: AppointmentPatient;
}

export interface AppointmentDetail extends AppointmentListItem {
  updatedAt?: string;
  doctor: AppointmentDoctor;
  patient: AppointmentPatient;
}

export interface AppointmentListResponse {
  data: AppointmentListItem[];
  meta: PaginationMeta;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  date: string;
  startTime: string;
  type?: "IN_PERSON" | "VIRTUAL";
  reason?: string;
}

export interface CancelAppointmentRequest {
  reason?: string;
}

export interface UpdateAppointmentStatusRequest {
  status: string;
  notes?: string;
  cancelReason?: string;
}

export interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface AvailabilityException {
  id: string;
  date: string;
  available: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

// =============================================================================
// Appointment API
// =============================================================================

export const appointmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Availability ---
    getDoctorAvailability: builder.query<
      ApiResponse<AvailabilityResponse>,
      { doctorId: string; date: string }
    >({
      query: ({ doctorId, date }) =>
        `/doctors/${doctorId}/availability?date=${date}`,
      providesTags: (_result, _error, { doctorId }) => [
        { type: "Appointment", id: `availability-${doctorId}` },
      ],
    }),

    // --- Create Appointment ---
    createAppointment: builder.mutation<
      ApiResponse<{ id: string; startTime: string; endTime: string; status: string }>,
      CreateAppointmentRequest
    >({
      query: (data) => ({
        url: "/appointments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Appointment"],
    }),

    // --- Patient Appointments ---
    getPatientAppointments: builder.query<
      AppointmentListResponse,
      { filter?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.filter) sp.set("filter", params.filter);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/patient/appointments${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Appointment"],
    }),

    getPatientAppointmentDetail: builder.query<
      ApiResponse<AppointmentDetail>,
      string
    >({
      query: (appointmentId) => `/patient/appointments/${appointmentId}`,
      providesTags: (_result, _error, id) => [
        { type: "Appointment", id },
      ],
    }),

    cancelPatientAppointment: builder.mutation<
      ApiResponse<{ id: string; status: string }>,
      { appointmentId: string; reason?: string }
    >({
      query: ({ appointmentId, ...body }) => ({
        url: `/patient/appointments/${appointmentId}/cancel`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appointment"],
    }),

    // --- Doctor Appointments ---
    getDoctorAppointments: builder.query<
      AppointmentListResponse,
      { filter?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.filter) sp.set("filter", params.filter);
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        const qs = sp.toString();
        return `/doctor/appointments${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Appointment"],
    }),

    getDoctorAppointmentDetail: builder.query<
      ApiResponse<AppointmentDetail>,
      string
    >({
      query: (appointmentId) => `/doctor/appointments/${appointmentId}`,
      providesTags: (_result, _error, id) => [
        { type: "Appointment", id },
      ],
    }),

    updateAppointmentStatus: builder.mutation<
      ApiResponse<{ id: string; status: string }>,
      { appointmentId: string } & UpdateAppointmentStatusRequest
    >({
      query: ({ appointmentId, ...body }) => ({
        url: `/doctor/appointments/${appointmentId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Appointment"],
    }),

    // --- Doctor Schedule ---
    getDoctorSchedule: builder.query<ApiResponse<ScheduleEntry[]>, void>({
      query: () => "/doctor/schedule",
      providesTags: ["Doctor"],
    }),

    updateDoctorSchedule: builder.mutation<
      ApiResponse<ScheduleEntry[]>,
      { schedules: Omit<ScheduleEntry, "id">[] }
    >({
      query: (data) => ({
        url: "/doctor/schedule",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Doctor"],
    }),

    // --- Doctor Availability Exceptions ---
    getDoctorAvailabilityExceptions: builder.query<
      ApiResponse<AvailabilityException[]>,
      { from?: string; to?: string }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.from) sp.set("from", params.from);
        if (params.to) sp.set("to", params.to);
        const qs = sp.toString();
        return `/doctor/availability${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Doctor"],
    }),

    createAvailabilityException: builder.mutation<
      ApiResponse<AvailabilityException>,
      {
        date: string;
        available: boolean;
        startTime?: string;
        endTime?: string;
        reason?: string;
      }
    >({
      query: (data) => ({
        url: "/doctor/availability",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Doctor"],
    }),

    deleteAvailabilityException: builder.mutation<
      ApiResponse<{ deleted: boolean }>,
      string
    >({
      query: (exceptionId) => ({
        url: `/doctor/availability?id=${exceptionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Doctor"],
    }),
  }),
});

export const {
  useGetDoctorAvailabilityQuery,
  useCreateAppointmentMutation,
  useGetPatientAppointmentsQuery,
  useGetPatientAppointmentDetailQuery,
  useCancelPatientAppointmentMutation,
  useGetDoctorAppointmentsQuery,
  useGetDoctorAppointmentDetailQuery,
  useUpdateAppointmentStatusMutation,
  useGetDoctorScheduleQuery,
  useUpdateDoctorScheduleMutation,
  useGetDoctorAvailabilityExceptionsQuery,
  useCreateAvailabilityExceptionMutation,
  useDeleteAvailabilityExceptionMutation,
} = appointmentApi;
