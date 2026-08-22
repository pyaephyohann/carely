"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { useAppDispatch } from "@/hooks/useRedux";
import { setUser } from "@/store/slices/authSlice";
import type { User as UserType } from "@/types";

type UserRole = "PATIENT" | "DOCTOR";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [role, setRole] = useState<UserRole>("PATIENT");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      if (formData.password.length < 8) newErrors.password = "Must be at least 8 characters";
      else if (!/[A-Z]/.test(formData.password)) newErrors.password = "Must contain an uppercase letter";
      else if (!/[a-z]/.test(formData.password)) newErrors.password = "Must contain a lowercase letter";
      else if (!/[0-9]/.test(formData.password)) newErrors.password = "Must contain a number";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    if (role === "DOCTOR" && !formData.licenseNumber.trim()) {
      newErrors.licenseNumber = "License number is required for doctors";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const body: Record<string, string> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role,
      };

      if (role === "DOCTOR") {
        body.licenseNumber = formData.licenseNumber.trim();
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.details) {
          // Map server field errors to our error state
          const fieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(data.error.details as Record<string, string[]>)) {
            if (messages.length > 0) fieldErrors[field] = messages[0];
          }
          setErrors(fieldErrors);
        }
        setServerError(data.error?.message || "Registration failed. Please try again.");
        return;
      }

      if (data.success && data.data?.user) {
        const userData: UserType = {
          id: data.data.user.id,
          email: data.data.user.email,
          role: data.data.user.role as UserType["role"],
          status: data.data.user.status as UserType["status"],
          createdAt: data.data.user.createdAt,
          updatedAt: data.data.user.updatedAt,
        };
        dispatch(setUser(userData));

        const roleRoutes: Record<string, string> = {
          PATIENT: "/patient/dashboard",
          DOCTOR: "/doctor/dashboard",
        };
        router.push(roleRoutes[userData.role] || "/patient/dashboard");
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-900 mb-2">Create an account</h2>
      <p className="text-zinc-600 mb-6">
        Join Carely and start your healthcare journey
      </p>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Role Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setRole("PATIENT")}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            role === "PATIENT"
              ? "border-violet-500 bg-violet-50"
              : "border-zinc-200 hover:border-zinc-300"
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              role === "PATIENT" ? "bg-violet-100 text-violet-600" : "bg-zinc-100 text-zinc-600"
            )}
          >
            <User className="h-5 w-5" />
          </div>
          <span className="font-medium text-zinc-900">Patient</span>
          <span className="text-xs text-zinc-500">Book appointments</span>
        </button>

        <button
          type="button"
          onClick={() => setRole("DOCTOR")}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            role === "DOCTOR"
              ? "border-violet-500 bg-violet-50"
              : "border-zinc-200 hover:border-zinc-300"
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              role === "DOCTOR" ? "bg-violet-100 text-violet-600" : "bg-zinc-100 text-zinc-600"
            )}
          >
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="font-medium text-zinc-900">Doctor</span>
          <span className="text-xs text-zinc-500">Manage practice</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            error={errors.firstName}
            autoComplete="given-name"
            required
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            error={errors.lastName}
            autoComplete="family-name"
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          error={errors.email}
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => updateField("password", e.target.value)}
          error={errors.password}
          helperText={role === "DOCTOR" ? "Min. 8 characters, uppercase, lowercase, and number" : "Must be at least 8 characters"}
          autoComplete="new-password"
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        {/* Doctor-specific field */}
        {role === "DOCTOR" && (
          <Input
            label="Medical License Number"
            placeholder="e.g., MED-12345"
            value={formData.licenseNumber}
            onChange={(e) => updateField("licenseNumber", e.target.value)}
            error={errors.licenseNumber}
            helperText="Your official medical license number for verification"
            required
          />
        )}

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            required
          />
          <span className="text-sm text-zinc-600">
            I agree to the{" "}
            <Link href="/terms" className="text-violet-600 hover:text-violet-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-violet-600 hover:text-violet-700">
              Privacy Policy
            </Link>
          </span>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="text-violet-600 hover:text-violet-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
