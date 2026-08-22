"use client";

import { useAppSelector } from "./useRedux";
import { selectCurrentUser, selectIsAuthenticated, selectIsLoading, selectUserRole } from "@/store/slices/authSlice";
import type { UserRole } from "@/types";

export function useAuth() {
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const role = useAppSelector(selectUserRole);

  const hasRole = (requiredRole: UserRole) => {
    return role === requiredRole;
  };

  const hasAnyRole = (roles: UserRole[]) => {
    return role ? roles.includes(role) : false;
  };

  const isPatient = role === "PATIENT";
  const isDoctor = role === "DOCTOR";
  const isAdmin = role === "ADMIN";

  return {
    user,
    isAuthenticated,
    isLoading,
    role,
    hasRole,
    hasAnyRole,
    isPatient,
    isDoctor,
    isAdmin,
  };
}
