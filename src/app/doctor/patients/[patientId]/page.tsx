"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  User,
  AlertCircle,
  Pill,
  FileText,
  Stethoscope,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { useGetDoctorPatientDetailQuery } from "@/store/api/doctorPatientApi";
import { getStatusLabel, getStatusVariant } from "@/lib/appointment-utils";
import {
  getPrescriptionStatusLabel,
  getPrescriptionStatusVariant,
} from "@/lib/prescription-utils";
import { cn } from "@/utils/cn";

const APPOINTMENT_TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
] as const;

type AppointmentTab = (typeof APPOINTMENT_TABS)[number]["value"];

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return {
    date: date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export default function DoctorPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const [appointmentTab, setAppointmentTab] = useState<AppointmentTab>("upcoming");

  const { data, isLoading, error, refetch, isFetching } =
    useGetDoctorPatientDetailQuery(patientId, { refetchOnFocus: true });

  const detail = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title="Patient not found"
          description="This patient doesn't exist or you don't have access to their record."
          action={
            <Button onClick={() => router.push("/doctor/patients")} className="cursor-pointer">
              Back to Patients
            </Button>
          }
        />
      </div>
    );
  }

  const { patient, stats, appointments, prescriptions, consultations, medicalRecords } = detail;

  const visibleAppointments =
    appointmentTab === "upcoming"
      ? appointments.upcoming
      : appointmentTab === "past"
        ? appointments.past
        : appointments.all;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between gap-2"
      >
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="cursor-pointer"
          aria-label="Refresh patient details"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold text-foreground">Patient Details</h1>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <Avatar
                firstName={patient.firstName}
                lastName={patient.lastName}
                src={patient.avatar}
                size="lg"
              />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-lg font-semibold text-foreground" title={patient.fullName}>
                    {patient.firstName} {patient.lastName}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {patient.age != null && (
                      <Badge variant="default" size="sm">
                        {patient.age} years
                      </Badge>
                    )}
                    {patient.genderLabel && (
                      <Badge variant="default" size="sm">
                        {patient.genderLabel}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="text-foreground">{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="text-foreground truncate">{patient.email}</span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="text-foreground">{patient.address}</span>
                    </div>
                  )}
                  {patient.dateOfBirth && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="text-foreground">
                        Born{" "}
                        {new Date(patient.dateOfBirth).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1">
                  <span>{stats.appointmentCount} appointments</span>
                  <span>{stats.prescriptionCount} prescriptions</span>
                  <span>{stats.consultationCount} consultations</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {detail.prescriptionAppointmentId ? (
                <Link href={`/doctor/appointments/${detail.prescriptionAppointmentId}`}>
                  <Button size="sm" className="cursor-pointer">
                    <Pill className="h-4 w-4" />
                    Create Prescription
                  </Button>
                </Link>
              ) : (
                <Button size="sm" disabled title="No eligible appointment for a prescription">
                  <Pill className="h-4 w-4" />
                  Create Prescription
                </Button>
              )}
              <a href="#appointments" className="cursor-pointer">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Calendar className="h-4 w-4" />
                  View Appointments
                </Button>
              </a>
              <a href="#prescriptions" className="cursor-pointer">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Stethoscope className="h-4 w-4" />
                  View Prescriptions
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card id="appointments">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-lg font-semibold text-foreground">Appointments</h2>
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
              {APPOINTMENT_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setAppointmentTab(tab.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
                    appointmentTab === tab.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments in this category.</p>
          ) : (
            visibleAppointments.map((appt) => {
              const { date, time } = formatDateTime(appt.startTime);
              return (
                <div
                  key={appt.id}
                  className="p-4 rounded-lg border border-border bg-muted/30 space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{date}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        {time}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(appt.status)} size="sm">
                      {getStatusLabel(appt.status)}
                    </Badge>
                  </div>
                  {appt.reason && (
                    <p className="text-sm text-foreground">
                      <span className="text-muted-foreground">Reason: </span>
                      {appt.reason}
                    </p>
                  )}
                  {appt.followUpDate && (
                    <p className="text-sm text-muted-foreground">
                      Follow-up:{" "}
                      {new Date(appt.followUpDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <Link href={`/doctor/appointments/${appt.id}`}>
                    <Button variant="outline" size="sm" className="cursor-pointer mt-1">
                      Open Appointment
                    </Button>
                  </Link>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card id="prescriptions">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-lg font-semibold text-foreground">Prescriptions</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {prescriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No prescriptions issued to this patient yet.
            </p>
          ) : (
            prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-4 rounded-lg border border-border bg-muted/30 flex flex-wrap items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{rx.diagnosis}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(rx.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {rx.itemCount} {rx.itemCount === 1 ? "medicine" : "medicines"}
                  </p>
                  {rx.notes && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{rx.notes}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getPrescriptionStatusVariant(rx.status)} size="sm">
                    {getPrescriptionStatusLabel(rx.status)}
                  </Badge>
                  <Link href={`/doctor/prescriptions/${rx.id}`}>
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      View Prescription
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {(consultations.length > 0 || medicalRecords.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-lg font-semibold text-foreground">Clinical History</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {consultations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Consultations</h3>
                {consultations.map((c) => (
                  <div key={c.id} className="p-4 rounded-lg border border-border bg-muted/30">
                    {c.diagnosis && (
                      <p className="font-medium text-foreground">{c.diagnosis}</p>
                    )}
                    {c.symptoms && (
                      <p className="text-sm text-muted-foreground mt-1">{c.symptoms}</p>
                    )}
                    {c.notes && (
                      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{c.notes}</p>
                    )}
                    {c.followUpDate && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Follow-up:{" "}
                        {new Date(c.followUpDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {medicalRecords.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Medical Records</h3>
                {medicalRecords.map((record) => (
                  <div key={record.id} className="p-4 rounded-lg border border-border bg-muted/30">
                    <p className="font-medium text-foreground">{record.title}</p>
                    {record.description && (
                      <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                    )}
                    {record.treatmentPlan && (
                      <p className="text-sm text-foreground mt-2">{record.treatmentPlan}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(record.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
