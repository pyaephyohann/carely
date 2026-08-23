import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "same-origin",
  prepareHeaders: (headers) => {
    // No Authorization header needed — auth is via HttpOnly cookies.
    // The browser automatically includes cookies for same-origin requests.
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "User",
    "Doctor",
    "Patient",
    "Appointment",
    "Prescription",
    "Medicine",
    "Notification",
    "Admin",
  ],
  endpoints: () => ({}),
});
