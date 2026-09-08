"use client";

import { useState, useMemo } from "react";
import {
  User,
  Save,
  CheckCircle,
  AlertCircle,
  Pencil,
  X,
  Stethoscope,
  BadgeCheck,
  Palette,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/features/patient/empty-state";
import {
  useGetDoctorProfileQuery,
  useUpdateDoctorProfileMutation,
  useGetSpecializationsQuery,
  type DoctorProfile,
} from "@/store/api/doctorApi";
import { doctorProfileSchema } from "@/lib/validation";
import type { DoctorProfileInput } from "@/lib/validation";
import { cn } from "@/utils/cn";
import { ThemePreferenceSelector } from "@/components/theme";

function profileToFormData(profile: DoctorProfile): DoctorProfileInput {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone || "",
    specializationId: profile.specializationId || undefined,
    licenseNumber: profile.licenseNumber,
    bio: profile.bio || "",
    consultationFee: profile.consultationFee,
    yearsExperience: profile.yearsExperience ?? undefined,
  };
}

function ViewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function DoctorProfilePage() {
  const { data, isLoading, error, refetch } = useGetDoctorProfileQuery();
  const { data: specializationsData } = useGetSpecializationsQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateDoctorProfileMutation();

  const profile = data?.data;
  const specializations = specializationsData?.data || [];

  const initialFormData = useMemo(
    () => (profile ? profileToFormData(profile) : null),
    [profile],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<DoctorProfileInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const currentFormData = formData ?? initialFormData;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...(prev || initialFormData!),
      [name]:
        name === "consultationFee" || name === "yearsExperience"
          ? value === ""
            ? undefined
            : Number(value)
          : name === "specializationId"
            ? value || undefined
            : value || undefined,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setSuccess(false);
  };

  const handleCancelEdit = () => {
    setFormData(null);
    setIsEditing(false);
    setErrors({});
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFormData) return;
    setErrors({});
    setSuccess(false);

    const result = doctorProfileSchema.safeParse(currentFormData);
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
      setIsEditing(false);
      setFormData(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setErrors({ _form: "Failed to update profile. Please try again." });
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile || !currentFormData) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title="Could not load profile"
          description="We couldn't load your doctor profile. Please try again."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  const selectClassName =
    "w-full px-4 py-2.5 text-sm rounded-lg border transition-colors duration-200 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your professional information
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="self-start">
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </motion.div>

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Profile updated successfully
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar
                firstName={profile.firstName}
                lastName={profile.lastName}
                src={profile.avatar}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-foreground text-lg">
                    Dr. {profile.firstName} {profile.lastName}
                  </h2>
                  {profile.verified ? (
                    <Badge variant="success" size="sm">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Pending verification
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
                {profile.specialization && (
                  <p className="text-sm text-muted-foreground">
                    {profile.specialization.name}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
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
                {isEditing ? (
                  <Stethoscope className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  {isEditing ? "Edit Professional Details" : "Professional Information"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEditing
                    ? "Update your profile details below"
                    : "Your practice and contact information"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errors._form && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                    {errors._form}
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

                <div className="w-full">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Specialization
                  </label>
                  <select
                    name="specializationId"
                    value={currentFormData.specializationId || ""}
                    onChange={handleChange}
                    className={cn(selectClassName, errors.specializationId && "border-red-500")}
                  >
                    <option value="">Select specialization</option>
                    {specializations.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                  {errors.specializationId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.specializationId}
                    </p>
                  )}
                </div>

                <Input
                  label="License Number"
                  name="licenseNumber"
                  value={currentFormData.licenseNumber}
                  onChange={handleChange}
                  error={errors.licenseNumber}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Consultation Fee ($)"
                    name="consultationFee"
                    type="number"
                    min={0}
                    step="0.01"
                    value={currentFormData.consultationFee}
                    onChange={handleChange}
                    error={errors.consultationFee}
                    required
                  />
                  <Input
                    label="Years of Experience"
                    name="yearsExperience"
                    type="number"
                    min={0}
                    max={60}
                    value={currentFormData.yearsExperience ?? ""}
                    onChange={handleChange}
                    error={errors.yearsExperience}
                    placeholder="Optional"
                  />
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Bio / About
                  </label>
                  <textarea
                    name="bio"
                    value={currentFormData.bio || ""}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    placeholder="Tell patients about your background and approach to care"
                    className="w-full px-4 py-2.5 text-sm rounded-lg border transition-colors duration-200 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-y min-h-[100px]"
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bio}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button type="submit" isLoading={isUpdating} disabled={isUpdating}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ViewField label="First Name" value={profile.firstName} />
                  <ViewField label="Last Name" value={profile.lastName} />
                </div>
                <ViewField label="Email" value={profile.email} />
                <ViewField label="Phone" value={profile.phone} />
                <ViewField
                  label="Specialization"
                  value={profile.specialization?.name}
                />
                <ViewField label="License Number" value={profile.licenseNumber} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ViewField
                    label="Consultation Fee"
                    value={`$${profile.consultationFee.toFixed(2)}`}
                  />
                  <ViewField
                    label="Years of Experience"
                    value={
                      profile.yearsExperience != null
                        ? String(profile.yearsExperience)
                        : null
                    }
                  />
                </div>
                <ViewField label="Bio" value={profile.bio} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                  <ViewField label="Timezone" value={profile.timezone} />
                  <ViewField
                    label="Appointment Duration"
                    value={`${profile.appointmentDuration} minutes`}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Appearance</h2>
                <p className="text-sm text-muted-foreground">
                  Choose how Carely looks on your device
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ThemePreferenceSelector />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
