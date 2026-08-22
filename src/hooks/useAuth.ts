"use client";

import { useAppSelector } from "./useRedux";
import { selectCurrentUser, selectIsAuthenticated, selectUserRole } from "@/store/slices/authSlice";
import type { UserRole } from "@/types";

export function useAuth() {
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectUserRole);

  const hasRole = (requiredRole: UserRole) => {
    return role === requiredRole;
  };

  const hasAnyRole = (roles: UserRole[]) => {
    return role ? roles.includes(role) : false;
  };

  return {
    user,
    isAuthenticated,
    role,
    hasRole,
    hasAnyRole,
  };
}
