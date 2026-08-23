import { baseApi } from "./baseApi";
import type { ApiResponse, PaginationMeta } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  meta: PaginationMeta;
  unreadCount: number;
}

export interface NotificationPreferences {
  appointmentUpdates: boolean;
  appointmentReminders: boolean;
  prescriptionUpdates: boolean;
  pharmacyUpdates: boolean;
  emailEnabled: boolean;
}

// =============================================================================
// Notification API
// =============================================================================

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- List notifications ---
    getNotifications: builder.query<
      NotificationListResponse,
      { page?: number; limit?: number; unread?: boolean }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.page) sp.set("page", params.page.toString());
        if (params.limit) sp.set("limit", params.limit.toString());
        if (params.unread) sp.set("unread", "true");
        const qs = sp.toString();
        return `/notifications${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Notification"],
    }),

    // --- Unread count ---
    getUnreadCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notification"],
    }),

    // --- Mark as read ---
    markNotificationRead: builder.mutation<
      ApiResponse<{ read: boolean }>,
      string
    >({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),

    // --- Mark all as read ---
    markAllNotificationsRead: builder.mutation<
      ApiResponse<{ marked: number }>,
      void
    >({
      query: () => ({
        url: "/notifications/read-all",
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),

    // --- Preferences ---
    getNotificationPreferences: builder.query<
      ApiResponse<NotificationPreferences>,
      void
    >({
      query: () => "/notifications/preferences",
      providesTags: ["Notification"],
    }),

    updateNotificationPreferences: builder.mutation<
      ApiResponse<NotificationPreferences>,
      Partial<NotificationPreferences>
    >({
      query: (data) => ({
        url: "/notifications/preferences",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationApi;
