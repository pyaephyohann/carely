"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  Pill,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { NavbarRefresh } from "@/components/layout/navbar-refresh";
import { ConsultationForm } from "@/components/features/doctor/consultation-form";
import {
  useGetDoctorConsultationQuery,
} from "@/store/api/consultationApi";
import { getStatusLabel, getStatusVariant, getFetchErrorStatus } from "@/lib/appointment-utils";
import {
  getPrescriptionStatusLabel,
  getPrescriptionStatusVariant,
} from "@/lib/prescription-utils";
import { formatDate, formatDateTime } from "@/utils/date";
import { useAppDispatch } from "@/hooks/useRedux";
import { addToast } from "@/store/slices/uiSlice";

function consultationErrorCopy(error: unknown, consultationId?: string) {
  if (!consultationId) {
    return {
      title: "Invalid consultation link",
      description: "The consultation ID is missing from this URL.",
      canRetry: false,
    };
  }
  const status = getFetchErrorStatus(error);
  if (status === 404) {
    return {
      title: "Consultation not found",
      description: "This consultation doesn't exist or you don't have access.",
      canRetry: false,
    };
  }
  if (status === 403) {
    return {
      title: "Access denied",
      description: "You don't have permission to view this consultation.",
      canRetry: false,
    };
  }
  if (status === 401) {
    return {
      title: "Session expired",
      description: "Please sign in again to view this consultation.",
      canRetry: false,
    };
  }
  return {
    title: "Unable to load consultation",
    description: "Something went wrong while loading this consultation.",
    canRetry: true,
  };
}

export default function DoctorConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const rawId = params?.consultationId;
  const consultationId = Array.isArray(rawId) ? rawId[0] : rawId;
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, isFetching, error, refetch } = useGetDoctorConsultationQuery(
    consultationId ?? "",
    { skip: !consultationId, refetchOnFocus: true },
  );

  const consultation = data?.data;
  const prescription = consultation?.prescriptions?.[0];

  if (!consultationId || error || (!isLoading && !consultation)) {
    const copy = consultationErrorCopy(error, consultationId);
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title={copy.title}
          description={copy.description}
          action={
            <div className="flex flex-wrap gap-2 justify-center">
              {copy.canRetry && (
                <Button variant="outline" onClick={() => refetch()} className="cursor-pointer">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              )}
              <Button
                onClick={() => router.push("/doctor/consultations")}
                className="cursor-pointer"
              >
                Back to Consultations
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (isLoading || !consultation) {
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

  const handleEditSuccess = () => {
    setIsEditing(false);
    dispatch(
      addToast({
        type: "success",
        title: "Consultation updated",
        message: "Visit notes were saved.",
      }),
    );
    refetch();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <NavbarRefresh>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh consultation"
          className="cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </NavbarRefresh>

      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link
          href="/doctor/consultations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Consultations
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <h1 className="text-xl font-semibold text-foreground">Consultation</h1>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer self-start"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Consultation
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section aria-labelledby="patient-heading" className="space-y-3">
              <h2 id="patient-heading" className="text-sm font-medium text-muted-foreground">
                Patient
              </h2>
              <div className="flex items-center gap-4">
                <Avatar
                  firstName={consultation.patient?.firstName ?? ""}
                  lastName={consultation.patient?.lastName ?? ""}
                  src={consultation.patient?.avatar}
                  size="lg"
                />
                <div>
                  <p className="font-semibold text-foreground">
                    {consultation.patient?.firstName} {consultation.patient?.lastName}
                  </p>
                  {consultation.patient?.phone && (
                    <p className="text-sm text-muted-foreground">{consultation.patient.phone}</p>
                  )}
                </div>
              </div>
            </section>

            {consultation.appointment && (
              <section aria-labelledby="appointment-heading" className="space-y-2">
                <h2 id="appointment-heading" className="text-sm font-medium text-muted-foreground">
                  Appointment
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getStatusVariant(consultation.appointment.status)} size="sm">
                    {getStatusLabel(consultation.appointment.status)}
                  </Badge>
                </div>
                <p className="text-sm text-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(consultation.appointment.startTime, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-sm text-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatDateTime(consultation.appointment.startTime)}
                  {consultation.appointment.endTime
                    ? ` – ${formatDate(consultation.appointment.endTime, "h:mm a")}`
                    : ""}
                </p>
                {consultation.appointment.reason && (
                  <p className="text-sm text-muted-foreground italic">
                    &quot;{consultation.appointment.reason}&quot;
                  </p>
                )}
                <Link
                  href={`/doctor/appointments/${consultation.appointment.id}`}
                  className="inline-flex text-sm text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                >
                  View appointment
                </Link>
              </section>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {isEditing ? (
        <ConsultationForm
          appointmentId={consultation.appointmentId}
          patientName={`${consultation.patient?.firstName ?? ""} ${consultation.patient?.lastName ?? ""}`.trim()}
          consultationId={consultation.id}
          initialValues={{
            diagnosis: consultation.diagnosis ?? "",
            symptoms: consultation.symptoms ?? "",
            notes: consultation.notes ?? "",
            followUpDate: consultation.followUpDate?.slice(0, 10) ?? "",
          }}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-lg font-semibold text-foreground">Clinical Notes</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</h3>
              <p className="text-foreground">{consultation.diagnosis || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Symptoms / Reason</h3>
              <p className="text-foreground whitespace-pre-wrap">
                {consultation.symptoms || "—"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Treatment / Advice</h3>
              <p className="text-foreground whitespace-pre-wrap">{consultation.notes || "—"}</p>
            </div>
            {consultation.followUpDate && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Follow-up</h3>
                <p className="text-foreground">{formatDate(consultation.followUpDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-lg font-semibold text-foreground">Prescription</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {prescription ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{prescription.diagnosis}</p>
                <Badge variant={getPrescriptionStatusVariant(prescription.status)} size="sm">
                  {getPrescriptionStatusLabel(prescription.status)}
                </Badge>
              </div>
              {prescription.notes && (
                <p className="text-sm text-muted-foreground">{prescription.notes}</p>
              )}
              <div className="space-y-2">
                {prescription.items.map((item) => (
                  <div
                    key={item.id}
                    className="text-sm p-3 rounded-md bg-muted/30 border border-border"
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
              <Link href={`/doctor/prescriptions/${prescription.id}`}>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  View Prescription
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No prescription</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
