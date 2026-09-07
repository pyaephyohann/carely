"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  setUser,
  setLoading,
  selectIsAuthenticated,
  selectIsLoading,
} from "@/store/slices/authSlice";
import { refreshAuthSession, authLog } from "@/lib/auth-session";
import type { User } from "@/types";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/about", "/features", "/contact"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) return true;
  return false;
}

function mapMeUser(data: {
  id: string;
  email: string;
  role: User["role"];
  status: User["status"];
  createdAt: string;
  updatedAt: string;
}): User {
  return {
    id: data.id,
    email: data.email,
    role: data.role,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Shared session bootstrap + protected-route redirect.
 *
 * Critical behaviors:
 * - Bootstrap once on mount (NOT on every pathname change) — pathname
 *   re-checks previously wiped Redux after login and forced /login when
 *   opening routes like /doctor/schedule.
 * - Attempt refresh before treating 401 as logged-out.
 * - Only redirect after a confirmed unauthenticated decision, or after a
 *   previously authenticated session is cleared (logout / failed refresh).
 * - Never treat loading / network / 5xx as "must login".
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  /** Set when /me (+ optional refresh) proved there is no session. */
  const confirmedUnauthenticated = useRef(false);
  /** Tracks that we had a hydrated session this page lifetime. */
  const hadAuthenticatedSession = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      hadAuthenticatedSession.current = true;
      confirmedUnauthenticated.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        authLog("Session bootstrap — requesting /api/users/me");
        let response = await fetch("/api/users/me", {
          credentials: "same-origin",
        });

        if (response.status === 401) {
          authLog("API returned 401 — attempting session refresh");
          const refreshed = await refreshAuthSession();
          if (refreshed) {
            response = await fetch("/api/users/me", {
              credentials: "same-origin",
            });
          }
        }

        if (cancelled) return;

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            authLog("Session present — user hydrated");
            confirmedUnauthenticated.current = false;
            dispatch(setUser(mapMeUser(json.data)));
            return;
          }
        }

        if (response.status === 401 || response.status === 403) {
          authLog(`Session invalid after recovery (status ${response.status})`);
          confirmedUnauthenticated.current = true;
          dispatch(setUser(null));
          return;
        }

        authLog(`Session check non-auth failure (status ${response.status}) — keeping state`);
        dispatch(setLoading(false));
      } catch {
        if (cancelled) return;
        authLog("Session check network error — keeping current state");
        dispatch(setLoading(false));
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) return;
    if (isPublicPath(pathname)) return;

    const shouldRedirect =
      confirmedUnauthenticated.current || hadAuthenticatedSession.current;

    if (!shouldRedirect) return;

    authLog(`Unauthenticated access to protected path ${pathname} — redirecting to login`);
    router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }, [isLoading, isAuthenticated, pathname, router]);

  return <>{children}</>;
}
