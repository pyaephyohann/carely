"use client";

import { use } from "react";
import { AlertCircle, RefreshCw, ArrowLeft, CheckCircle, XCircle, Star, Users, Calendar, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAdminDoctorQuery, useUpdateDoctorVerificationMutation } from "@/store/api/adminApi";
import Link from "next/link";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminDoctorDetailPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);
  const { data, isLoading, error, refetch } = useGetAdminDoctorQuery(doctorId);
  const [updateVerification, { isLoading: isUpdating }] = useUpdateDoctorVerificationMutation();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-48 animate-pulse" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Doctor not found</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">Unable to load doctor details.</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const doctor = data.data;

  const handleVerification = async (verified: boolean) => {
    try {
      await updateVerification({ doctorId: doctor.id, verified }).unwrap();
    } catch {
      // Error handled by RTK Query
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/doctors"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Doctors
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Dr. {doctor.firstName} {doctor.lastName}
            </h1>
            {doctor.verified ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle className="h-3 w-3 mr-1" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Pending Verification
              </span>
            )}
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {doctor.specialization || "No specialization"} · License: {doctor.licenseNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!doctor.verified ? (
            <Button onClick={() => handleVerification(true)} disabled={isUpdating}>
              <CheckCircle className="h-4 w-4 mr-2" /> Verify Doctor
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleVerification(false)}
              disabled={isUpdating}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <XCircle className="h-4 w-4 mr-2" /> Unverify
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-1">
              <Users className="h-4 w-4" /> Prescriptions
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{doctor.counts.prescriptions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-1">
              <Calendar className="h-4 w-4" /> Appointments
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{doctor.counts.appointments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-1">
              <FileText className="h-4 w-4" /> Consultations
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{doctor.counts.consultations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-1">
              <Star className="h-4 w-4" /> Rating
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {doctor.rating ? doctor.rating.toFixed(1) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Professional Details</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{doctor.email}</p>
            </div>
            {doctor.phone && (
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Phone</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{doctor.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Consultation Fee</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">${doctor.consultationFee}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Experience</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {doctor.yearsExperience ? `${doctor.yearsExperience} years` : "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Appointment Duration</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{doctor.appointmentDuration} minutes</p>
            </div>
            {doctor.bio && (
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Bio</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-100">{doctor.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Working Schedule</h2>
          </CardHeader>
          <CardContent>
            {doctor.schedules.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">No schedule configured</p>
            ) : (
              <div className="space-y-2">
                {doctor.schedules.map((schedule) => (
                  <div key={schedule.dayOfWeek} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {DAYS[schedule.dayOfWeek]}
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {schedule.startTime} – {schedule.endTime}
                      </span>
                      {schedule.active ? (
                        <span className="text-xs text-emerald-600">Active</span>
                      ) : (
                        <span className="text-xs text-zinc-400">Inactive</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
