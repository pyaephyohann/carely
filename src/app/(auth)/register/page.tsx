"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

type UserRole = "PATIENT" | "DOCTOR";

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>("PATIENT");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement registration API call
    setIsLoading(false);
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-900 mb-2">Create an account</h2>
      <p className="text-zinc-600 mb-6">
        Join Carely and start your healthcare journey
      </p>

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
            required
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => updateField("password", e.target.value)}
          required
          helperText="Must be at least 8 characters"
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
          required
        />

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
