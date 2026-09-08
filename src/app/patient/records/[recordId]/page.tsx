"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Pill,
  AlertCircle,
  FileText,
  Phone,
  Stethoscope,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { useGetPatientMedicalRecordQuery } from "@/store/api/consultationApi";
import { getStatusLabel, getStatusVariant } from "@/lib/appointment-utils";
import {
  getPrescriptionStatusLabel,
  getPrescriptionStatusVariant,
} from "@/lib/prescription-utils";
import { getRecordTypeLabel } from "@/lib/patient-medical-record-utils";

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PatientMedicalRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.recordId as string;

  const { data, isLoading, error } = useGetPatientMedicalRecordQuery(recordId);

  const record = data?.data;

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

  if (error || !record) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title="Medical record not found"
          description="This record doesn't exist or you don't have access."
          action={
            <Button onClick={() => router.push("/patient/records")} className="cursor-pointer">
              Back to Medical Records
            </Button>
          }
        />
      </div>
    );
  }

  const hasClinicalInfo = Boolean(
    record.clinical.diagnosis?.trim() ||
      record.clinical.symptoms?.trim() ||
      record.clinical.notes?.trim() ||
      record.clinical.treatmentPlan?.trim(),
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link
          href="/patient/records"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Medical Records
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Medical Record</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatLongDate(record.visitDate)}
                </p>
              </div>
              {record.medicalRecord && (
                <Badge variant="default" size="md">
                  {getRecordTypeLabel(record.medicalRecord.type)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {record.doctor && (
              <div className="flex items-center gap-4">
                <Avatar
                  firstName={record.doctor.firstName}
                  lastName={record.doctor.lastName}
                  src={record.doctor.avatar}
                  size="lg"
                />
                <div>
                  <p className="font-semibold text-foreground">
                    Dr. {record.doctor.firstName} {record.doctor.lastName}
                  </p>
                  {record.doctor.specialization && (
                    <p className="text-sm text-muted-foreground">{record.doctor.specialization}</p>
                  )}
                  {record.doctor.phone && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Phone className="h-3.5 w-3.5" />
                      {record.doctor.phone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {record.appointment && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  Visit Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Visit Date</p>
                    <p className="font-medium text-foreground">
                      {formatLongDate(record.appointment.startTime)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatShortTime(record.appointment.startTime)} –{" "}
                      {formatShortTime(record.appointment.endTime)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Appointment Status</p>
                    <Badge variant={getStatusVariant(record.appointment.status)} size="sm">
                      {getStatusLabel(record.appointment.status)}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {record.appointment.type === "VIRTUAL" ? "Virtual Visit" : "In-Person Visit"}
                    </p>
                  </div>
                </div>
                {record.appointment.reason && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Reason for Visit</p>
                    <p className="text-sm text-foreground">{record.appointment.reason}</p>
                  </div>
                )}
              </div>
            )}

            {hasClinicalInfo && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  Clinical Information
                </h2>
                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                  {record.clinical.diagnosis && (
                    <div>
                      <p className="text-xs text-muted-foreground">Diagnosis</p>
                      <p className="text-sm text-foreground">{record.clinical.diagnosis}</p>
                    </div>
                  )}
                  {record.clinical.symptoms && (
                    <div>
                      <p className="text-xs text-muted-foreground">Symptoms</p>
                      <p className="text-sm text-foreground">{record.clinical.symptoms}</p>
                    </div>
                  )}
                  {record.clinical.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Clinical Notes</p>
                      <p className="text-sm text-foreground">{record.clinical.notes}</p>
                    </div>
                  )}
                  {record.clinical.treatmentPlan && (
                    <div>
                      <p className="text-xs text-muted-foreground">Treatment / Assessment</p>
                      <p className="text-sm text-foreground">{record.clinical.treatmentPlan}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {record.followUpDate && (
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                <p className="text-sm font-medium text-foreground">Recommended Follow-up</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatLongDate(record.followUpDate)}
                </p>
              </div>
            )}

            {record.prescriptions.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  Prescription{record.prescriptions.length > 1 ? "s" : ""}
                </h2>
                <div className="space-y-4">
                  {record.prescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="p-4 rounded-lg bg-muted/50 border border-border space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{prescription.diagnosis}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Prescribed {formatLongDate(prescription.createdAt)}
                          </p>
                        </div>
                        <Badge variant={getPrescriptionStatusVariant(prescription.status)} size="sm">
                          {getPrescriptionStatusLabel(prescription.status)}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {prescription.items.map((item) => (
                          <div key={item.id} className="p-3 rounded-lg bg-background border border-border">
                            <p className="font-medium text-foreground">{item.medicineName}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mt-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Dosage</p>
                                <p className="font-medium text-foreground">{item.dosage}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Frequency</p>
                                <p className="font-medium text-foreground">{item.frequency}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Duration</p>
                                <p className="font-medium text-foreground">{item.duration}</p>
                              </div>
                            </div>
                            {item.instructions && (
                              <div className="mt-2 p-2 rounded bg-muted/50 text-sm flex items-start gap-1.5">
                                <Info className="h-3.5 w-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">{item.instructions}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <Link href={`/patient/prescriptions/${prescription.id}`}>
                        <Button variant="outline" size="sm" className="cursor-pointer">
                          View Full Prescription
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">No prescription for this visit</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      A prescription is optional and may be added separately by your doctor.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {record.medicalRecord?.attachments?.length ? (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2">Attachments</h2>
                <ul className="space-y-2">
                  {record.medicalRecord.attachments.map((attachment) => (
                    <li key={attachment}>
                      <a
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                      >
                        {attachment}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
