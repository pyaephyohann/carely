import { baseApi } from "./baseApi";
import type { ApiResponse } from "@/types";

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthUserResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: Record<string, unknown> | null;
}

interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: "PATIENT" | "DOCTOR";
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthUserResponse>, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation<ApiResponse<AuthUserResponse>, RegisterRequest>({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
    }),
    logout: builder.mutation<{ success: boolean; data: { message: string } }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
    getMe: builder.query<ApiResponse<AuthUserResponse>, void>({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;
