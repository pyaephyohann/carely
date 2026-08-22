"use client";

import { useState, useMemo } from "react";
import { User, Save, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import {
  useGetPatientProfileQuery,
  useUpdatePatientProfileMutation,
} from "@/store/api/patientApi";
import { patientProfileSchema } from "@/lib/validation";
import type { PatientProfileInput } from "@/lib/validation";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
] as const;

function profileToFormData(profile: {
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | null;
  address: string | null;
}): PatientProfileInput {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone || "",
    dateOfBirth: profile.dateOfBirth
      ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: profile.gender || undefined,
    address: profile.address || "",
  };
}

export default function ProfilePage() {
  const { data, isLoading, error } = useGetPatientProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdatePatientProfileMutation();

  const profile = data?.data;

  const initialFormData = useMemo(
    () => (profile ? profileToFormData(profile) : null),
    [profile],
  );

  const [formData, setFormData] = useState<PatientProfileInput | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Use the current form data, falling back to initial
  const currentFormData = formData ?? initialFormData;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...(prev || initialFormData!),
      [name]: value || undefined,
    }));
    setIsDirty(true);
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFormData) return;
    setErrors({});
    setSuccess(false);

    // Validate
    const result = patientProfileSchema.safeParse(currentFormData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      await updateProfile(result.data).unwrap();
      setSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setErrors({ _form: "Failed to update profile. Please try again." });
    }
  };

  // Loading state
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title="Could not load profile"
          description="We couldn't load your profile information. Please try again."
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  if (!currentFormData) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Personal Information</h2>
                <p className="text-sm text-muted-foreground">
                  Update your personal details
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Form-level error */}
              {errors._form && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                  {errors._form}
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Profile updated successfully
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={currentFormData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={currentFormData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  required
                />
              </div>

              <Input
                label="Email"
                value={profile.email}
                disabled
                helperText="Email cannot be changed"
              />

              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={currentFormData.phone || ""}
                onChange={handleChange}
                error={errors.phone}
                placeholder="+1 (555) 123-4567"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={currentFormData.dateOfBirth || ""}
                  onChange={handleChange}
                  error={errors.dateOfBirth}
                />

                <div className="w-full">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={currentFormData.gender || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border transition-colors duration-200 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Address"
                name="address"
                value={currentFormData.address || ""}
                onChange={handleChange}
                error={errors.address}
                placeholder="123 Main Street, City, State"
              />

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" isLoading={isUpdating}>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
                {isDirty && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setFormData(null);
                      setIsDirty(false);
                      setErrors({});
                      setSuccess(false);
                    }}
                  >
                    Discard
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
