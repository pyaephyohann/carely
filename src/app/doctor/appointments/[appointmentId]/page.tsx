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
  Phone,
  Mail,
  User,
  Stethoscope,
  Pill,
  FileText,
  RefreshCw,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { ConsultationForm } from "@/components/features/doctor/consultation-form";
import { PrescriptionForm } from "@/components/features/doctor/prescription-form";
import {
  useGetDoctorAppointmentDetailQuery,
  useUpdateAppointmentStatusMutation,
} from "@/store/api/appointmentApi";
import {
  getStatusLabel,
  getStatusVariant,
  getValidTransitions,
  getDurationMinutes,
  formatDuration,
  DOCTOR_REJECT_REASON,
} from "@/lib/appointment-utils";
import {
  getPrescriptionStatusLabel,
  getPrescriptionStatusVariant,
} from "@/lib/prescription-utils";
import { isClinicalAppointmentStatus } from "@/lib/prescription-service";

export default function DoctorAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  const [showConsultation, setShowConsultation] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const { data, isLoading, error, refetch, isFetching } =
    useGetDoctorAppointmentDetailQuery(appointmentId, {
      refetchOnFocus: true,
    });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAppointmentStatusMutation();

  const appointment = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title="Appointment not found"
          description="This appointment doesn't exist or you don't have access."
          action={
            <Button onClick={() => router.push("/doctor/appointments")}>
              Back to Appointments
            </Button>
          }
        />
      </div>
    );
  }

  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  const duration = getDurationMinutes(appointment.startTime, appointment.endTime);
  const validTransitions = getValidTransitions(appointment.status);
  const consultation = appointment.consultation;
  const prescriptions = consultation?.prescriptions ?? [];
  const isClinical = isClinicalAppointmentStatus(appointment.status);
  const hasPrescription = prescriptions.length > 0;
  const canMarkCompleted = validTransitions.includes("COMPLETED");

  const handleStatusUpdate = async (status: string, cancelReason?: string) => {
    try {
      await updateStatus({ appointmentId: appointment.id, status, cancelReason }).unwrap();
    } catch {
      // RTK Query handles error state
    }
  };

  const handleConsultationSuccess = () => {
    setShowConsultation(false);
    refetch();
  };

  const handlePrescriptionSuccess = () => {
    setShowPrescriptionForm(false);
    refetch();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between gap-2"
      >
        <Link
          href="/doctor/appointments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="cursor-pointer"
          aria-label="Refresh appointment"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
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
                {getStatusLabel(appointment.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar
                firstName={appointment.patient.firstName}
                lastName={appointment.patient.lastName}
                src={appointment.patient.avatar}
                size="lg"
              />
              <div>
                <p className="font-semibold text-foreground">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                  {appointment.patient.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {appointment.patient.phone}
                    </span>
                  )}
                  {appointment.patient.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {appointment.patient.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

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
                  {appointment.type === "VIRTUAL" ? "Virtual Consultation" : "In-Person Visit"}
                </p>
              </div>
              {appointment.patient.gender && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <User className="h-4 w-4" />
                    Patient
                  </div>
                  <p className="font-medium text-foreground">{appointment.patient.gender}</p>
                </div>
              )}
            </div>

            {appointment.reason && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Reason for Visit</h3>
                <p className="text-foreground">{appointment.reason}</p>
              </div>
            )}

            {appointment.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                <p className="text-foreground">{appointment.notes}</p>
              </div>
            )}

            {validTransitions.length > 0 && appointment.status === "PENDING" && (
              <div className="border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {validTransitions.includes("CONFIRMED") && (
                    <Button
                      onClick={() => handleStatusUpdate("CONFIRMED")}
                      isLoading={isUpdating}
                      className="cursor-pointer"
                    >
                      Accept Request
                    </Button>
                  )}
                  {validTransitions.includes("CANCELLED") && (
                    <Button
                      variant="danger"
                      onClick={() =>
                        handleStatusUpdate("CANCELLED", DOCTOR_REJECT_REASON)
                      }
                      isLoading={isUpdating}
                      className="cursor-pointer"
                    >
                      Reject Request
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isClinical && (
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Clinical Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {!hasPrescription && !showPrescriptionForm && (
                    <Button
                      onClick={() => setShowPrescriptionForm(true)}
                      className="cursor-pointer"
                    >
                      <Pill className="h-4 w-4" />
                      Create Prescription
                    </Button>
                  )}
                  {canMarkCompleted && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("COMPLETED")}
                      isLoading={isUpdating}
                      className="cursor-pointer"
                    >
                      <Stethoscope className="h-4 w-4" />
                      Mark as Completed
                    </Button>
                  )}
                  {!consultation && !showConsultation && (
                    <Button
                      variant="outline"
                      onClick={() => setShowConsultation(true)}
                      className="cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      Add Visit Notes
                    </Button>
                  )}
                  {validTransitions.includes("NO_SHOW") && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("NO_SHOW")}
                      isLoading={isUpdating}
                      className="cursor-pointer"
                    >
                      Mark No Show
                    </Button>
                  )}
                  {validTransitions.includes("CANCELLED") && appointment.status === "CONFIRMED" && (
                    <Button
                      variant="danger"
                      onClick={() => handleStatusUpdate("CANCELLED")}
                      isLoading={isUpdating}
                      className="cursor-pointer"
                    >
                      Cancel Appointment
                    </Button>
                  )}
                </div>
              </div>
            )}

            {appointment.status === "CANCELLED" && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>
                    {appointment.cancelReason === DOCTOR_REJECT_REASON ||
                    (appointment.cancelReason ?? "").toLowerCase().includes("reject")
                      ? "Declined"
                      : "Cancelled"}
                  </strong>
                  {appointment.cancelledBy ? ` by ${appointment.cancelledBy.toLowerCase()}` : ""}
                  {appointment.cancelReason ? `: ${appointment.cancelReason}` : ""}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Booked on{" "}
              {new Date(appointment.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Consultation record */}
      {consultation && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-lg font-semibold text-foreground">Consultation Record</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</h3>
              <p className="text-foreground">{consultation.diagnosis}</p>
            </div>
            {consultation.symptoms && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Symptoms</h3>
                <p className="text-foreground">{consultation.symptoms}</p>
              </div>
            )}
            {consultation.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Clinical Notes</h3>
                <p className="text-foreground whitespace-pre-wrap">{consultation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prescriptions section — available for confirmed/completed visits */}
      {(isClinical || showPrescriptionForm) && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <h2 className="text-lg font-semibold text-foreground">Prescription</h2>
              </div>
              {!hasPrescription && !showPrescriptionForm && (
                <Button
                  size="sm"
                  onClick={() => setShowPrescriptionForm(true)}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Create Prescription
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {prescriptions.length > 0 ? (
              prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{rx.diagnosis}</p>
                    <Badge variant={getPrescriptionStatusVariant(rx.status)} size="sm">
                      {getPrescriptionStatusLabel(rx.status)}
                    </Badge>
                  </div>
                  {rx.notes && (
                    <p className="text-sm text-muted-foreground">{rx.notes}</p>
                  )}
                  <div className="space-y-2">
                    {rx.items.map((item) => (
                      <div
                        key={item.id}
                        className="text-sm p-3 rounded-md bg-background border border-border"
                      >
                        <p className="font-medium text-foreground">{item.medicineName}</p>
                        <p className="text-muted-foreground mt-1">
                          {item.dosage} · {item.frequency} · {item.duration}
                        </p>
                        {item.instructions && (
                          <p className="text-muted-foreground mt-1 italic">{item.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link href={`/doctor/prescriptions/${rx.id}`}>
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      View Prescription
                    </Button>
                  </Link>
                </div>
              ))
            ) : !showPrescriptionForm ? (
              <p className="text-sm text-muted-foreground">
                No prescription has been created for this visit yet.
              </p>
            ) : null}

            {showPrescriptionForm && (
              <PrescriptionForm
                consultationId={consultation?.id}
                appointmentId={consultation ? undefined : appointment.id}
                defaultDiagnosis={consultation?.diagnosis || appointment.reason || ""}
                onSuccess={handlePrescriptionSuccess}
                onCancel={() => setShowPrescriptionForm(false)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {showConsultation && !consultation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ConsultationForm
            appointmentId={appointment.id}
            patientName={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
            onSuccess={handleConsultationSuccess}
            onCancel={() => setShowConsultation(false)}
          />
        </motion.div>
      )}
    </div>
  );
}
