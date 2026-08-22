import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../index";
import { API_BASE_URL } from "@/lib/constants";

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL || "/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["User", "Doctor", "Patient", "Appointment", "Prescription", "Medicine", "Notification"],
  endpoints: () => ({}),
});
