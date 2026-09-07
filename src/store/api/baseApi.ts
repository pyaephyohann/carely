import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { refreshAuthSession, authLog } from "@/lib/auth-session";
import { logout } from "@/store/slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "same-origin",
  prepareHeaders: (headers) => {
    // No Authorization header needed — auth is via HttpOnly cookies.
    // The browser automatically includes cookies for same-origin requests.
    return headers;
  },
});

function getRequestUrl(args: string | FetchArgs): string {
  return typeof args === "string" ? args : args.url;
}

function shouldAttemptRefresh(url: string): boolean {
  // Avoid refresh loops on auth endpoints themselves
  return !(
    url.includes("/auth/refresh") ||
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/logout")
  );
}

/**
 * Centralized 401 handling:
 * - Attempt one session refresh
 * - Retry the original request once
 * - Only clear local auth if refresh fails
 * - Do NOT redirect on 403/4xx/5xx business errors
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = getRequestUrl(args);

  if (result.error?.status === 401 && shouldAttemptRefresh(url)) {
    authLog(`API request returned 401 (${url}) — attempting refresh`);
    const refreshed = await refreshAuthSession();

    if (refreshed) {
      authLog(`Retrying authenticated request (${url})`);
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      authLog("Refresh failed — clearing client auth state");
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
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
