"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch } from "@/hooks/useRedux";
import { setUser } from "@/store/slices/authSlice";
import type { User } from "@/types";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/about", "/features", "/contact"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) return true;
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/users/me", {
          credentials: "same-origin",
        });

        if (cancelled) return;

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            const userData: User = {
              id: json.data.id,
              email: json.data.email,
              role: json.data.role as User["role"],
              status: json.data.status as User["status"],
              createdAt: json.data.createdAt,
              updatedAt: json.data.updatedAt,
            };
            dispatch(setUser(userData));
            return;
          }
        }

        // No valid session
        dispatch(setUser(null));

        // Redirect to login if on a protected route
        if (!isPublicPath(pathname)) {
          router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
      } catch {
        if (cancelled) return;
        dispatch(setUser(null));
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [dispatch, router, pathname]);

  return <>{children}</>;
}
