"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useAppDispatch } from "./useRedux";
import { logout } from "@/store/slices/authSlice";

export function useLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logoutUser = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Continue with local logout even if API fails
    } finally {
      dispatch(logout());
      router.push("/login");
      setIsLoggingOut(false);
    }
  }, [dispatch, router]);

  return { logout: logoutUser, isLoggingOut };
}
