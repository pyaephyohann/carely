"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Pill,
  AlertCircle,
  FileText,
  Phone,
  User,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { useGetPatientPrescriptionQuery } from "@/store/api/consultationApi";

function getStatusVariant(
  status: string,
): "default" | "primary" | "success" | "warning" | "error" | "info" {
  const variants: Record<string, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
    DRAFT: "warning",
    ACTIVE: "info",
    FINALIZED: "primary",
    COMPLETED: "success",
    CANCELLED: "error",
  };
  return variants[status] || "default";
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    ACTIVE: "Active",
    FINALIZED: "Finalized",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
}

export default function PatientPrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prescriptionId = params.prescriptionId as string;

  const { data, isLoading, error } = useGetPatientPrescriptionQuery(prescriptionId);

  const prescription = data?.data;

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

  if (error || !prescription) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title="Prescription not found"
          description="This prescription doesn't exist or you don't have access."
          action={
            <Button onClick={() => router.push("/patient/prescriptions")}>
              Back to Prescriptions
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link
          href="/patient/prescriptions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prescriptions
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">Prescription</h1>
              <Badge variant={getStatusVariant(prescription.status)} size="md">
                {getStatusLabel(prescription.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Doctor Info */}
            <div className="flex items-center gap-4">
              <Avatar
                firstName={prescription.doctor?.firstName ?? ""}
                lastName={prescription.doctor?.lastName ?? ""}
                src={prescription.doctor?.avatar}
                size="lg"
              />
              <div>
                <p className="font-semibold text-foreground">
                  Dr. {prescription.doctor?.firstName} {prescription.doctor?.lastName}
                </p>
                {prescription.doctor?.specialization && (
                  <p className="text-sm text-muted-foreground">
                    {prescription.doctor.specialization}
                  </p>
                )}
                {prescription.doctor?.phone && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Phone className="h-3.5 w-3.5" />
                    {prescription.doctor.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Prescription Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Prescribed On
                </div>
                <p className="font-medium text-foreground">
                  {new Date(prescription.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              {prescription.validUntil && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    Valid Until
                  </div>
                  <p className="font-medium text-foreground">
                    {new Date(prescription.validUntil).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
              {prescription.appointmentDate && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <User className="h-4 w-4" />
                    Appointment Date
                  </div>
                  <p className="font-medium text-foreground">
                    {new Date(prescription.appointmentDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</h3>
              <p className="text-foreground">{prescription.diagnosis}</p>
            </div>

            {/* Consultation Info */}
            {prescription.consultation && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <FileText className="h-4 w-4" />
                  Consultation Notes
                </div>
                {prescription.consultation.symptoms && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground">Symptoms</p>
                    <p className="text-sm text-foreground">{prescription.consultation.symptoms}</p>
                  </div>
                )}
                {prescription.consultation.notes && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground">Clinical Notes</p>
                    <p className="text-sm text-foreground">{prescription.consultation.notes}</p>
                  </div>
                )}
                {prescription.consultation.followUpDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Follow-up Date</p>
                    <p className="text-sm text-foreground">
                      {new Date(prescription.consultation.followUpDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Prescription Notes */}
            {prescription.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Prescription Notes</h3>
                <p className="text-foreground">{prescription.notes}</p>
              </div>
            )}

            {/* Medicines */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                Medications ({prescription.items.length})
              </h3>
              <div className="space-y-3">
                {prescription.items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-medium text-foreground">{item.medicineName}</p>
                        {item.medicineGenericName && (
                          <p className="text-xs text-muted-foreground">
                            Generic: {item.medicineGenericName}
                          </p>
                        )}
                      </div>
                      {item.medicineCategory && (
                        <Badge variant="default" size="sm">
                          {item.medicineCategory}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
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
                      <div className="mt-2 p-2 rounded bg-background text-sm">
                        <div className="flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{item.instructions}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
