"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  AlertCircle,
  DollarSign,
  Phone,
  FileText,
  ClipboardList,
  RefreshCw,
  Hash,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { NavbarRefresh } from "@/components/layout/navbar-refresh";
import {
  useGetPatientAppointmentDetailQuery,
  useCancelPatientAppointmentMutation,
} from "@/store/api/appointmentApi";
import {
  getStatusVariant,
  getAppointmentDisplayLabel,
  getDurationMinutes,
  formatDuration,
} from "@/lib/appointment-utils";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } =
    useGetPatientAppointmentDetailQuery(appointmentId, {
      pollingInterval: 30_000,
      refetchOnFocus: true,
    });
  const [cancelAppointment, { isLoading: isCancelling }] =
    useCancelPatientAppointmentMutation();

  const appointment = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !appointment) {
    const isNotFound =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: number }).status === 404;

    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title={isNotFound ? "Appointment not found" : "Unable to load appointment"}
          description={
            isNotFound
              ? "This appointment doesn't exist or you don't have access."
              : "Something went wrong while loading this appointment. Your session may still be valid."
          }
          action={
            <div className="flex flex-wrap gap-2 justify-center">
              {!isNotFound && (
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                  Retry
                </Button>
              )}
              <Button onClick={() => router.push("/patient/appointments")} className="cursor-pointer">
                Back to Appointments
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  const duration = getDurationMinutes(appointment.startTime, appointment.endTime);
  const canCancel = ["PENDING", "CONFIRMED"].includes(appointment.status);

  const handleCancel = async () => {
    setCancelError(null);
    try {
      await cancelAppointment({ appointmentId: appointment.id }).unwrap();
      router.push("/patient/appointments");
    } catch {
      setCancelError("Unable to cancel this appointment. Please try again.");
      setShowCancelConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between gap-2"
      >
        <Link
          href="/patient/appointments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Link>
        <NavbarRefresh>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh appointment"
            className="cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </NavbarRefresh>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-semibold text-foreground">Appointment Details</h1>
              <Badge variant={getStatusVariant(appointment.status)} size="md">
                {getAppointmentDisplayLabel(appointment.status, {
                  cancelledBy: appointment.cancelledBy,
                  cancelReason: appointment.cancelReason,
                })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Doctor */}
            <div className="flex items-center gap-4">
              <Avatar
                firstName={appointment.doctor.firstName}
                lastName={appointment.doctor.lastName}
                src={appointment.doctor.avatar}
                size="lg"
              />
              <div>
                <p className="font-semibold text-foreground">
                  Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                </p>
                {appointment.doctor.specialization && (
                  <p className="text-sm text-muted-foreground">
                    {appointment.doctor.specialization}
                  </p>
                )}
                <Link
                  href={`/patient/doctors/${appointment.doctor.id}`}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                >
                  View doctor profile
                </Link>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Date
                </div>
                <p className="font-medium text-foreground">
                  {startDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  Time
                </div>
                <p className="font-medium text-foreground">
                  {startDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  —{" "}
                  {endDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">{formatDuration(duration)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  {appointment.type === "VIRTUAL" ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  Type
                </div>
                <p className="font-medium text-foreground">
                  {appointment.type === "VIRTUAL"
                    ? "Virtual Consultation"
                    : "In-Person Visit"}
                </p>
              </div>
              {appointment.doctor.consultationFee != null && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <DollarSign className="h-4 w-4" />
                    Fee
                  </div>
                  <p className="font-medium text-foreground">
                    ${appointment.doctor.consultationFee}
                  </p>
                </div>
              )}
            </div>

            {appointment.reason && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Reason for Visit
                </h3>
                <p className="text-foreground">{appointment.reason}</p>
              </div>
            )}

            {appointment.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Notes / Instructions
                </h3>
                <p className="text-foreground whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            )}

            {appointment.status === "PENDING" && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  This request is awaiting confirmation from the doctor. You&apos;ll see the
                  status update here once they confirm or decline it.
                </p>
              </div>
            )}

            {/* Doctor contact */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Doctor Contact</h3>
              <div className="flex flex-wrap gap-3 text-sm">
                {appointment.doctor.phone ? (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {appointment.doctor.phone}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No phone on file</span>
                )}
              </div>
            </div>

            {/* Cancel info */}
            {appointment.status === "CANCELLED" && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>
                    {getAppointmentDisplayLabel(appointment.status, {
                      cancelledBy: appointment.cancelledBy,
                      cancelReason: appointment.cancelReason,
                    })}
                  </strong>
                  {appointment.cancelledBy ? ` by ${appointment.cancelledBy.toLowerCase()}` : ""}
                  {appointment.cancelReason ? `: ${appointment.cancelReason}` : ""}
                </p>
              </div>
            )}

            {/* Post-appointment */}
            {appointment.status === "COMPLETED" && (
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-sm font-medium text-foreground">After your visit</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href="/patient/prescriptions">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4" />
                      Prescriptions
                    </Button>
                  </Link>
                  <Link href="/patient/records">
                    <Button variant="outline" size="sm">
                      <ClipboardList className="h-4 w-4" />
                      Medical Records
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {cancelError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {cancelError}
              </div>
            )}

            {/* Cancel action */}
            {canCancel && (
              <div className="border-t border-border pt-4">
                {showCancelConfirm ? (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      Cancel this appointment? This cannot be undone. You&apos;ll need to book a
                      new time if you change your mind.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleCancel}
                        isLoading={isCancelling}
                      >
                        Yes, Cancel Appointment
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        Keep Appointment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancel Appointment
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground border-t border-border pt-4">
              <p>
                Booked on{" "}
                {new Date(appointment.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="flex items-center gap-1 font-mono">
                <Hash className="h-3 w-3" />
                {appointment.id}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
