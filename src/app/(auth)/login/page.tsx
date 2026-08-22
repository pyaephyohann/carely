"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/hooks/useRedux";
import { setUser } from "@/store/slices/authSlice";
import type { User } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "Invalid email or password");
        return;
      }

      if (data.success && data.data?.user) {
        const userData: User = {
          id: data.data.user.id,
          email: data.data.user.email,
          role: data.data.user.role,
          status: data.data.user.status,
          createdAt: data.data.user.createdAt,
          updatedAt: data.data.user.updatedAt,
        };
        dispatch(setUser(userData));

        // Redirect to appropriate dashboard or callback URL
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          const roleRoutes: Record<string, string> = {
            PATIENT: "/patient/dashboard",
            DOCTOR: "/doctor/dashboard",
            ADMIN: "/admin/dashboard",
          };
          router.push(roleRoutes[userData.role] || "/patient/dashboard");
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-900 mb-2">Welcome back</h2>
      <p className="text-zinc-600 mb-8">
        Sign in to your account to continue
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-sm text-zinc-600">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-violet-600 hover:text-violet-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-violet-600 hover:text-violet-700 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
